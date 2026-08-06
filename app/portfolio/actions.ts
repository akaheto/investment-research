"use server";

import { db } from "@/db/client";
import { accounts, holdings, planMenu, proxyMap, pricesDaily, instruments } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export interface AccountOverview {
  id: number;
  name: string;
  institution: string;
  taxType: string;
  balance: number;
  fundCount: number;
  allocation: { equities: number; bonds: number; other: number };
  expenseRatioBps: number;
}

export interface PortfolioAssessment {
  accounts: AccountOverview[];
  totalBalance: number;
  combinedAllocation: { equities: number; bonds: number; other: number };
  costDragBps: number;
  topHoldings: Array<{ symbol: string; value: number; percentage: number }>;
}

/**
 * Get portfolio overview for all accounts
 * Calculates real-time values using current prices: value = quantity * currentPrice
 */
export async function getPortfolioOverview(): Promise<PortfolioAssessment> {
  const allAccounts = await db.select().from(accounts);

  const accountOverviews: AccountOverview[] = [];
  let totalBalance = 0;
  let totalExpenseBps = 0;

  for (const account of allAccounts) {
    // Get all holdings for this account (latest snapshot)
    const holdings_data = await db
      .select()
      .from(holdings)
      .where(eq(holdings.accountId, account.id))
      .orderBy(desc(holdings.asOf))
      .limit(100); // Get all holdings (across multiple funds)

    if (holdings_data.length === 0) continue;

    // Get latest holdings snapshot (all holdings at same asOf date)
    const latestAsOf = holdings_data[0].asOf;
    const latestHoldings = holdings_data.filter((h) => h.asOf === latestAsOf);

    // Calculate real-time balance: sum of (quantity * current price)
    let balance = 0;
    for (const holding of latestHoldings) {
      // Get the instrument price via proxyMap
      const mapping = await db
        .select()
        .from(proxyMap)
        .where(eq(proxyMap.planFundId, holding.planFundId));

      if (mapping.length > 0) {
        const instrumentId = mapping[0].instrumentId;
        const latestPrice = await db
          .select()
          .from(pricesDaily)
          .where(eq(pricesDaily.instrumentId, instrumentId))
          .orderBy(desc(pricesDaily.date))
          .limit(1);

        if (latestPrice.length > 0 && holding.units) {
          balance += holding.units * latestPrice[0].close;
        }
      }
    }

    // Get fund count
    const funds = await db.select().from(planMenu).where(eq(planMenu.accountId, account.id));

    // Estimate allocation based on asset class slots
    const equityFunds = funds.filter((f) =>
      ["us_large_cap", "us_mid_cap", "intl_developed", "emerging_markets", "growth"].includes(f.assetClassSlot)
    );
    const bondFunds = funds.filter((f) => f.assetClassSlot.includes("bond"));
    const otherCount = funds.length - equityFunds.length - bondFunds.length;

    const allocation = {
      equities: (equityFunds.length / funds.length) * 100 || 60,
      bonds: (bondFunds.length / funds.length) * 100 || 30,
      other: (otherCount / funds.length) * 100 || 10,
    };

    // Calculate average expense ratio
    const totalExpenseRatio = funds.reduce((sum, f) => sum + (f.expenseRatio || 0), 0);
    const avgExpenseRatioBps = Math.round((totalExpenseRatio / funds.length) * 10000) || 18;

    accountOverviews.push({
      id: account.id,
      name: account.name,
      institution: account.institution,
      taxType: account.taxType,
      balance,
      fundCount: funds.length,
      allocation,
      expenseRatioBps: avgExpenseRatioBps,
    });

    totalBalance += balance;
    totalExpenseBps += avgExpenseRatioBps;
  }

  // Combined allocation (weighted by balance)
  let combinedEquities = 0,
    combinedBonds = 0,
    combinedOther = 0;
  for (const account of accountOverviews) {
    const weight = account.balance / totalBalance;
    combinedEquities += account.allocation.equities * weight;
    combinedBonds += account.allocation.bonds * weight;
    combinedOther += account.allocation.other * weight;
  }

  // Average cost drag
  const avgCostDragBps = accountOverviews.length > 0 ? Math.round(totalExpenseBps / accountOverviews.length) : 0;

  // Top holdings (across all accounts)
  const topHoldings: Array<{ symbol: string; value: number; percentage: number }> = [];
  for (const account of accountOverviews) {
    const accountHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.accountId, account.id))
      .orderBy(desc(holdings.asOf))
      .limit(50);

    for (const holding of accountHoldings) {
      const existing = topHoldings.find((h) => h.symbol === holding.planFundId.toString());
      if (existing) {
        existing.value += holding.balance;
      } else {
        topHoldings.push({
          symbol: holding.planFundId.toString(),
          value: holding.balance,
          percentage: (holding.balance / account.balance) * 100,
        });
      }
    }
  }

  topHoldings.sort((a, b) => b.value - a.value);

  return {
    accounts: accountOverviews,
    totalBalance,
    combinedAllocation: {
      equities: Math.round(combinedEquities),
      bonds: Math.round(combinedBonds),
      other: Math.round(combinedOther),
    },
    costDragBps: avgCostDragBps,
    topHoldings: topHoldings.slice(0, 5),
  };
}

export interface HoldingWithValue {
  id: number;
  planFundId: number;
  units: number | null;
  balance: number;
  realTimeValue: number;
  asOf: string;
  source: string;
}

/**
 * Get account detail with holdings
 * Includes real-time calculated values: quantity * current price
 */
export async function getAccountDetail(accountId: number) {
  const account = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (account.length === 0) return null;

  const holdings_data = await db
    .select()
    .from(holdings)
    .where(eq(holdings.accountId, accountId))
    .orderBy(desc(holdings.asOf));

  const funds = await db.select().from(planMenu).where(eq(planMenu.accountId, accountId));

  // Calculate real-time values for each holding
  const holdingsWithValues: HoldingWithValue[] = [];
  for (const holding of holdings_data) {
    let realTimeValue = holding.balance; // Fallback to stored balance

    // Get current price via proxyMap
    const mapping = await db
      .select()
      .from(proxyMap)
      .where(eq(proxyMap.planFundId, holding.planFundId));

    if (mapping.length > 0) {
      const latestPrice = await db
        .select()
        .from(pricesDaily)
        .where(eq(pricesDaily.instrumentId, mapping[0].instrumentId))
        .orderBy(desc(pricesDaily.date))
        .limit(1);

      if (latestPrice.length > 0 && holding.units) {
        realTimeValue = holding.units * latestPrice[0].close;
      }
    }

    holdingsWithValues.push({
      ...holding,
      realTimeValue,
    });
  }

  return {
    account: account[0],
    holdings: holdingsWithValues,
    funds,
  };
}
