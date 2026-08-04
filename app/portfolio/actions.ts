"use server";

import { db } from "@/db/client";
import { accounts, holdings, planMenu } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
 */
export async function getPortfolioOverview(): Promise<PortfolioAssessment> {
  const allAccounts = await db.select().from(accounts);

  const accountOverviews: AccountOverview[] = [];
  let totalBalance = 0;
  let totalExpenseBps = 0;

  for (const account of allAccounts) {
    // Get latest holdings for this account
    const holdings_data = await db
      .select()
      .from(holdings)
      .where(eq(holdings.accountId, account.id))
      .orderBy(desc(holdings.asOf))
      .limit(1);

    if (holdings_data.length === 0) continue;

    const latestHoldings = holdings_data[0];
    const balance = latestHoldings.balance;

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

/**
 * Get account detail with holdings
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

  return {
    account: account[0],
    holdings: holdings_data,
    funds,
  };
}
