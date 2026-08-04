"use server";

import { db } from "@/db/client";
import { funds, fundPerformance, fundHoldings } from "@/db/schema";
import { eq } from "drizzle-orm";

interface FundData {
  fundName: string;
  fundCategory: string;
  inceptionDate: string;
  unitShareValue: number;
  expenseRatioGross: number;
  expenseRatioNet: number;
  assetClassSlot: string;
  performance: {
    oneMonth: number;
    threeMonths: number;
    ytd: number;
    oneYear: number;
    threeYears: number;
    fiveYears: number;
    tenYears: number;
  };
}

/**
 * Seed Transamerica fund menu data
 * Data from 07/31/2026 fund menu report
 */
const TRANSAMERICA_FUNDS: FundData[] = [
  // Short Bonds/Stable/MMkt
  {
    fundName: "Vanguard Federal Money Market Inv",
    fundCategory: "money_market",
    inceptionDate: "07/81",
    unitShareValue: 1.0,
    expenseRatioGross: 0.11,
    expenseRatioNet: 0.11,
    assetClassSlot: "mm",
    performance: { oneMonth: 0.30, threeMonths: 0.90, ytd: 2.10, oneYear: 3.89, threeYears: 4.66, fiveYears: 3.57, tenYears: 2.31 },
  },

  // Interm./Long-Term Bonds
  {
    fundName: "TCW MetWest Total Return Bond P",
    fundCategory: "bonds",
    inceptionDate: "03/97",
    unitShareValue: 8.37,
    expenseRatioGross: 0.38,
    expenseRatioNet: 0.38,
    assetClassSlot: "bonds",
    performance: { oneMonth: -1.37, threeMonths: -0.93, ytd: -0.79, oneYear: 3.84, threeYears: 4.41, fiveYears: -0.14, tenYears: 1.77 },
  },
  {
    fundName: "Vanguard Total Bond Market Index I",
    fundCategory: "bonds",
    inceptionDate: "12/86",
    unitShareValue: 9.48,
    expenseRatioGross: 0.03,
    expenseRatioNet: 0.03,
    assetClassSlot: "bonds",
    performance: { oneMonth: -1.31, threeMonths: -0.74, ytd: -0.56, oneYear: 3.72, threeYears: 4.17, fiveYears: 0.08, tenYears: 1.53 },
  },

  // Large-Cap Stocks
  {
    fundName: "Dodge & Cox Stock X",
    fundCategory: "large_cap",
    inceptionDate: "05/22",
    unitShareValue: 17.94,
    expenseRatioGross: 0.41,
    expenseRatioNet: 0.41,
    assetClassSlot: "us_large_cap",
    performance: { oneMonth: 5.90, threeMonths: 6.15, ytd: 9.99, oneYear: 9.86, threeYears: 14.10, fiveYears: 9.09, tenYears: 13.18 },
  },
  {
    fundName: "Fidelity 500 Index Institutional Prem",
    fundCategory: "large_cap",
    inceptionDate: "02/88",
    unitShareValue: 269.37,
    expenseRatioGross: 0.01,
    expenseRatioNet: 0.01,
    assetClassSlot: "us_large_cap",
    performance: { oneMonth: -0.07, threeMonths: 4.19, ytd: 10.13, oneYear: 22.31, threeYears: 20.60, fiveYears: 13.39, tenYears: 15.49 },
  },
  {
    fundName: "NYLI Winslow Large Cap Growth R6",
    fundCategory: "large_cap",
    inceptionDate: "07/95",
    unitShareValue: 11.87,
    expenseRatioGross: 0.63,
    expenseRatioNet: 0.63,
    assetClassSlot: "us_large_cap",
    performance: { oneMonth: -4.35, threeMonths: 1.89, ytd: 1.11, oneYear: 9.41, threeYears: 21.49, fiveYears: 11.40, tenYears: 17.49 },
  },

  // Small/Mid-Cap Stocks
  {
    fundName: "Principal Global Real Estate Sec Inst",
    fundCategory: "mid_cap",
    inceptionDate: "10/07",
    unitShareValue: 10.72,
    expenseRatioGross: 0.94,
    expenseRatioNet: 0.94,
    assetClassSlot: "us_mid_cap",
    performance: { oneMonth: 2.29, threeMonths: 2.00, ytd: 12.13, oneYear: 11.10, threeYears: 8.88, fiveYears: 0.87, tenYears: 4.13 },
  },
  {
    fundName: "Fidelity Extended Market Index",
    fundCategory: "mid_cap",
    inceptionDate: "11/97",
    unitShareValue: 114.13,
    expenseRatioGross: 0.03,
    expenseRatioNet: 0.03,
    assetClassSlot: "us_mid_cap",
    performance: { oneMonth: -4.16, threeMonths: 4.46, ytd: 13.37, oneYear: 29.01, threeYears: 19.70, fiveYears: 6.73, tenYears: 12.62 },
  },
  {
    fundName: "DFA US Small Cap I",
    fundCategory: "mid_cap",
    inceptionDate: "03/92",
    unitShareValue: 61.22,
    expenseRatioGross: 0.27,
    expenseRatioNet: 0.27,
    assetClassSlot: "us_mid_cap",
    performance: { oneMonth: -1.70, threeMonths: 5.29, ytd: 17.73, oneYear: 31.10, threeYears: 16.42, fiveYears: 9.22, tenYears: 11.61 },
  },
  {
    fundName: "William Blair Small-Mid Cap Core R6",
    fundCategory: "mid_cap",
    inceptionDate: "10/19",
    unitShareValue: 18.76,
    expenseRatioGross: 0.90,
    expenseRatioNet: 0.90,
    assetClassSlot: "us_mid_cap",
    performance: { oneMonth: -2.49, threeMonths: 5.33, ytd: 12.67, oneYear: 20.80, threeYears: 11.23, fiveYears: 5.71, tenYears: 10.94 },
  },

  // International Stocks
  {
    fundName: "Fidelity International Discovery",
    fundCategory: "international",
    inceptionDate: "12/86",
    unitShareValue: 63.59,
    expenseRatioGross: 0.66,
    expenseRatioNet: 0.66,
    assetClassSlot: "intl_developed",
    performance: { oneMonth: -2.23, threeMonths: 3.55, ytd: 11.29, oneYear: 21.33, threeYears: 18.32, fiveYears: 7.36, tenYears: 10.08 },
  },
  {
    fundName: "Fidelity International Index",
    fundCategory: "international",
    inceptionDate: "11/97",
    unitShareValue: 67.97,
    expenseRatioGross: 0.03,
    expenseRatioNet: 0.03,
    assetClassSlot: "intl_developed",
    performance: { oneMonth: 1.55, threeMonths: 4.68, ytd: 11.79, oneYear: 20.46, threeYears: 16.73, fiveYears: 9.35, tenYears: 9.83 },
  },

  // Target Date Retirement
  {
    fundName: "Vanguard Target Retirement Income Inv",
    fundCategory: "target_date",
    inceptionDate: "10/03",
    unitShareValue: 14.21,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.84, threeMonths: 0.91, ytd: 3.59, oneYear: 9.72, threeYears: 9.11, fiveYears: 4.06, tenYears: 5.35 },
  },
  {
    fundName: "Vanguard Target Retirement 2020 Inv",
    fundCategory: "target_date",
    inceptionDate: "06/06",
    unitShareValue: 25.54,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.87, threeMonths: 0.99, ytd: 3.97, oneYear: 10.65, threeYears: 10.04, fiveYears: 4.64, tenYears: 6.99 },
  },
  {
    fundName: "Vanguard Target Retirement 2025 Inv",
    fundCategory: "target_date",
    inceptionDate: "10/03",
    unitShareValue: 21.05,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.85, threeMonths: 1.54, ytd: 5.51, oneYear: 13.63, threeYears: 12.13, fiveYears: 5.84, tenYears: 8.17 },
  },
  {
    fundName: "Vanguard Target Retirement 2030 Inv",
    fundCategory: "target_date",
    inceptionDate: "06/06",
    unitShareValue: 45.12,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.92, threeMonths: 1.94, ytd: 6.59, oneYear: 15.90, threeYears: 13.62, fiveYears: 6.78, tenYears: 9.11 },
  },
  {
    fundName: "Vanguard Target Retirement 2035 Inv",
    fundCategory: "target_date",
    inceptionDate: "10/03",
    unitShareValue: 29.45,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.88, threeMonths: 2.26, ytd: 7.56, oneYear: 17.63, threeYears: 14.83, fiveYears: 7.61, tenYears: 9.98 },
  },
  {
    fundName: "Vanguard Target Retirement 2040 Inv",
    fundCategory: "target_date",
    inceptionDate: "06/06",
    unitShareValue: 54.18,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.84, threeMonths: 2.57, ytd: 8.47, oneYear: 19.33, threeYears: 16.04, fiveYears: 8.42, tenYears: 10.83 },
  },
  {
    fundName: "Vanguard Target Retirement 2045 Inv",
    fundCategory: "target_date",
    inceptionDate: "10/03",
    unitShareValue: 38.00,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.78, threeMonths: 2.87, ytd: 9.38, oneYear: 21.03, threeYears: 17.17, fiveYears: 9.20, tenYears: 11.54 },
  },
  {
    fundName: "Vanguard Target Retirement 2050 Inv",
    fundCategory: "target_date",
    inceptionDate: "06/06",
    unitShareValue: 85.36,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.76, threeMonths: 3.16, ytd: 10.26, oneYear: 22.70, threeYears: 18.26, fiveYears: 9.89, tenYears: 11.91 },
  },
  {
    fundName: "Vanguard Target Retirement 2055 Inv",
    fundCategory: "target_date",
    inceptionDate: "08/10",
    unitShareValue: 73.01,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.76, threeMonths: 3.18, ytd: 10.35, oneYear: 22.84, threeYears: 18.30, fiveYears: 9.91, tenYears: 11.92 },
  },
  {
    fundName: "Vanguard Target Retirement 2060 Inv",
    fundCategory: "target_date",
    inceptionDate: "01/12",
    unitShareValue: 67.30,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.75, threeMonths: 3.19, ytd: 10.36, oneYear: 22.82, threeYears: 18.29, fiveYears: 9.91, tenYears: 11.92 },
  },
  {
    fundName: "Vanguard Target Retirement 2065 Inv",
    fundCategory: "target_date",
    inceptionDate: "07/17",
    unitShareValue: 44.18,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.74, threeMonths: 3.20, ytd: 10.37, oneYear: 22.82, threeYears: 18.29, fiveYears: 9.92, tenYears: 11.31 },
  },
  {
    fundName: "Vanguard Target Retirement 2070 Inv",
    fundCategory: "target_date",
    inceptionDate: "06/22",
    unitShareValue: 35.11,
    expenseRatioGross: 0.08,
    expenseRatioNet: 0.08,
    assetClassSlot: "target_date",
    performance: { oneMonth: -0.76, threeMonths: 3.17, ytd: 10.34, oneYear: 22.81, threeYears: 18.29, fiveYears: 9.91, tenYears: 17.06 },
  },
];

/**
 * Seed all Transamerica funds into the database
 */
export async function seedTransamericaFunds(): Promise<{ ok: boolean; count?: number; message?: string }> {
  try {
    const asOfDate = "2026-07-31"; // From the fund menu report

    let count = 0;

    for (const fundData of TRANSAMERICA_FUNDS) {
      // Insert fund
      const fundResult = await db
        .insert(funds)
        .values({
          fundName: fundData.fundName,
          fundCategory: fundData.fundCategory,
          inceptionDate: fundData.inceptionDate,
          unitShareValue: fundData.unitShareValue,
          expenseRatioGross: fundData.expenseRatioGross,
          expenseRatioNet: fundData.expenseRatioNet,
          assetClassSlot: fundData.assetClassSlot,
          createdAt: now,
        })
        .returning();

      if (fundResult.length === 0) continue;

      const fundId = fundResult[0].id;

      // Insert performance data
      await db
        .insert(fundPerformance)
        .values({
          fundId,
          asOf: asOfDate,
          oneMonthPercent: fundData.performance.oneMonth,
          threeMonthsPercent: fundData.performance.threeMonths,
          ytdPercent: fundData.performance.ytd,
          oneYearPercent: fundData.performance.oneYear,
          threeYearsPercent: fundData.performance.threeYears,
          fiveYearsPercent: fundData.performance.fiveYears,
          tenYearsPercent: fundData.performance.tenYears,
        })
        .onConflictDoNothing();

      count++;
    }

    console.log(`✓ Seeded ${count} Transamerica funds`);
    return { ok: true, count, message: `Loaded ${count} funds into database` };
  } catch (error) {
    console.error("Failed to seed funds:", error);
    return { ok: false, message: String(error) };
  }
}

/**
 * Load holdings for Main 403b account
 * Data from user's account statement as of 07/31/2026
 */
export async function loadMainAccountHoldings(accountId: number): Promise<{
  ok: boolean;
  count?: number;
  totalBalance?: number;
  message?: string;
}> {
  try {
    const asOfDate = "2026-07-31";

    // Holdings data for Main 403b account
    const holdings = [
      { fundName: "Vanguard Total Bond Market Index I", units: 7.764583318, balance: 73841.19, percent: 9.14 },
      { fundName: "Dodge & Cox Stock X", units: 6.652695227, balance: 120546.84, percent: 14.93 },
      { fundName: "Fidelity 500 Index Institutional Prem", units: 1083.195323, balance: 286212.69, percent: 35.44 },
      { fundName: "Fidelity Extended Market Index", units: 707.127639, balance: 82203.59, percent: 10.18 },
      { fundName: "Principal Global Real Estate Sec Inst", units: 3811.734151, balance: 40785.55, percent: 5.05 },
      { fundName: "Fidelity International Index", units: 2986.097438, balance: 204069.89, percent: 25.27 },
    ];

    let totalBalance = 0;
    let count = 0;

    for (const holding of holdings) {
      // Find the fund by name
      const fund = await db
        .select()
        .from(funds)
        .where(eq(funds.fundName, holding.fundName))
        .limit(1);

      if (fund.length === 0) {
        console.warn(`Fund not found: ${holding.fundName}`);
        continue;
      }

      // Insert holding
      await db
        .insert(fundHoldings)
        .values({
          accountId,
          fundId: fund[0].id,
          unitsOwned: holding.units,
          balanceAmount: holding.balance,
          allocationPercent: holding.percent,
          asOf: asOfDate,
        })
        .onConflictDoNothing();

      totalBalance += holding.balance;
      count++;
    }

    console.log(`✓ Loaded ${count} holdings for account ${accountId}, total balance: $${totalBalance.toFixed(2)}`);
    return { ok: true, count, totalBalance, message: `Loaded ${count} holdings, total balance: $${totalBalance.toFixed(2)}` };
  } catch (error) {
    console.error("Failed to load holdings:", error);
    return { ok: false, message: String(error) };
  }
}

/**
 * Load holdings for Management Staff IRA account
 * Data from user's account statement as of 07/31/2026
 */
export async function loadManagementStaffIRAHoldings(accountId: number): Promise<{
  ok: boolean;
  count?: number;
  totalBalance?: number;
  message?: string;
}> {
  try {
    const asOfDate = "2026-07-31";

    // Holdings data for Management Staff IRA account
    const holdings = [
      { fundName: "Dodge & Cox Stock X", units: 1.091560466, balance: 19779.08, percent: 24.24 },
      { fundName: "Fidelity 500 Index Institutional Prem", units: 126.278954, balance: 33366.69, percent: 40.90 },
      { fundName: "NYLI Winslow Large Cap Growth R6", units: 1.265846058, balance: 15278.76, percent: 18.73 },
      { fundName: "Principal Global Real Estate Sec Inst", units: 621.288684, balance: 6647.79, percent: 8.15 },
      { fundName: "Fidelity International Index", units: 95.300974, balance: 6512.87, percent: 7.98 },
    ];

    let totalBalance = 0;
    let count = 0;

    for (const holding of holdings) {
      // Find the fund by name
      const fund = await db
        .select()
        .from(funds)
        .where(eq(funds.fundName, holding.fundName))
        .limit(1);

      if (fund.length === 0) {
        console.warn(`Fund not found: ${holding.fundName}`);
        continue;
      }

      // Insert holding
      await db
        .insert(fundHoldings)
        .values({
          accountId,
          fundId: fund[0].id,
          unitsOwned: holding.units,
          balanceAmount: holding.balance,
          allocationPercent: holding.percent,
          asOf: asOfDate,
        })
        .onConflictDoNothing();

      totalBalance += holding.balance;
      count++;
    }

    console.log(`✓ Loaded ${count} holdings for account ${accountId}, total balance: $${totalBalance.toFixed(2)}`);
    return { ok: true, count, totalBalance, message: `Loaded ${count} holdings, total balance: $${totalBalance.toFixed(2)}` };
  } catch (error) {
    console.error("Failed to load holdings:", error);
    return { ok: false, message: String(error) };
  }
}
