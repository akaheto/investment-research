"use server";

import { db } from "@/db/client";
import { funds, fundPerformance } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface FundScore {
  fundId: number;
  fundName: string;
  expenseRatioNet: number;
  assetClassSlot: string;
  ytdPercent: number | null;
  threeYearsPercent: number | null;
  performanceScore: number; // 0-100, higher is better
  costScore: number; // 0-100, higher is better (lower cost = higher score)
  overallScore: number; // 0-100
}

interface ScoringAlternative extends FundScore {
  costSavings: number; // annual savings per $1M invested
  performanceMatch: number; // -100 to +100, how similar performance is
}

/**
 * Get all funds in a specific asset class slot, ranked by score
 */
export async function scoreFundsBySlot(
  assetClassSlot: string,
  asOfDate: string = "2026-07-31"
): Promise<FundScore[]> {
  try {
    const fundsInSlot = await db
      .select()
      .from(funds)
      .where(eq(funds.assetClassSlot, assetClassSlot));

    if (fundsInSlot.length === 0) {
      return [];
    }

    // Get latest performance for each fund
    const fundIds = fundsInSlot.map((f) => f.id);
    const performances = await db
      .select()
      .from(fundPerformance)
      .where(and(eq(fundPerformance.asOf, asOfDate)))
      .then((perfs) => {
        // Create map for quick lookup
        const map = new Map<number, typeof perfs[0]>();
        perfs.forEach((p) => {
          if (fundIds.includes(p.fundId)) {
            map.set(p.fundId, p);
          }
        });
        return map;
      });

    // Score each fund
    const scores = fundsInSlot.map((fund) => {
      const perf = performances.get(fund.id);
      const ytdReturn = perf?.ytdPercent ?? 0;
      const threeYearReturn = perf?.threeYearsPercent ?? 0;

      // Performance score: normalize to 0-100
      // Using YTD + 3-year average as proxy
      const avgReturn = (ytdReturn + (threeYearReturn || 0)) / 2;
      const performanceScore = Math.min(100, Math.max(0, (avgReturn + 20) * 2.5));

      // Cost score: lower expense ratio = higher score
      // Normalize: 0% ER = 100, 1% ER = 0
      const maxER = 1.0;
      const er = fund.expenseRatioNet ?? 0.5; // Default to 0.5% if unknown
      const costScore = Math.max(0, 100 - (er / maxER) * 100);

      // Overall score: 60% cost, 40% performance
      const overallScore = costScore * 0.6 + performanceScore * 0.4;

      return {
        fundId: fund.id,
        fundName: fund.fundName,
        expenseRatioNet: er,
        assetClassSlot: fund.assetClassSlot ?? "",
        ytdPercent: ytdReturn,
        threeYearsPercent: threeYearReturn,
        performanceScore: Math.round(performanceScore),
        costScore: Math.round(costScore),
        overallScore: Math.round(overallScore),
      };
    });

    // Sort by overall score (highest first = best)
    return scores.sort((a, b) => b.overallScore - a.overallScore);
  } catch (error) {
    console.error("Failed to score funds by slot:", error);
    return [];
  }
}

/**
 * Find better alternatives for a specific fund
 * Returns candidates sorted by improvement potential
 */
export async function findBetterAlternatives(
  currentFundId: number,
  asOfDate: string = "2026-07-31"
): Promise<ScoringAlternative[]> {
  try {
    // Get current fund details
    const currentFund = await db
      .select()
      .from(funds)
      .where(eq(funds.id, currentFundId))
      .limit(1);

    if (currentFund.length === 0) {
      return [];
    }

    const current = currentFund[0];

    // Get performance data for current fund
    const currentPerformance = await db
      .select()
      .from(fundPerformance)
      .where(
        and(
          eq(fundPerformance.fundId, currentFundId),
          eq(fundPerformance.asOf, asOfDate)
        )
      )
      .limit(1);

    const currentYTD = currentPerformance[0]?.ytdPercent || 0;
    const currentThreeYr = currentPerformance[0]?.threeYearsPercent || 0;

    // Get all funds in same asset class slot
    const alternativesScored = await scoreFundsBySlot(
      current.assetClassSlot ?? "unknown",
      asOfDate
    );

    // Filter to only better alternatives (exclude current fund)
    // and calculate improvement metrics
    const betterAlternatives: ScoringAlternative[] = alternativesScored
      .filter((alt) => alt.fundId !== currentFundId)
      .filter((alt) => alt.overallScore > 0) // Must have some merit
      .slice(0, 3) // Top 3 alternatives
      .map((alt) => {
        // Cost savings per $1M invested annually
        const currentER = current.expenseRatioNet ?? 0.5;
        const erDifference = currentER - alt.expenseRatioNet;
        // erDifference is in % points (e.g., 0.40 = 0.40%); multiply by 10k to get $/1M
        const costSavings = erDifference * 10000;

        // Performance match: how similar are returns?
        const ytdDiff = Math.abs((alt.ytdPercent || 0) - currentYTD);
        const threeYrDiff = Math.abs((alt.threeYearsPercent || 0) - currentThreeYr);
        const performanceMatch = 100 - Math.min(100, (ytdDiff + threeYrDiff) / 2);

        return {
          ...alt,
          costSavings,
          performanceMatch,
        };
      });

    return betterAlternatives;
  } catch (error) {
    console.error("Failed to find better alternatives:", error);
    return [];
  }
}

/**
 * Score a specific fund against all alternatives in its asset class
 */
export async function scoreFundComparative(
  fundId: number,
  asOfDate: string = "2026-07-31"
): Promise<{
  currentFund: FundScore | null;
  percentile: number; // 0-100, where 100 = best in class
  alternatives: ScoringAlternative[];
}> {
  try {
    const fund = await db
      .select()
      .from(funds)
      .where(eq(funds.id, fundId))
      .limit(1);

    if (fund.length === 0) {
      return { currentFund: null, percentile: 0, alternatives: [] };
    }

    // Get all scores in this slot
    const allScores = await scoreFundsBySlot(fund[0].assetClassSlot ?? "unknown", asOfDate);

    // Find current fund's rank
    const currentScore = allScores.find((s) => s.fundId === fundId);
    if (!currentScore) {
      return { currentFund: null, percentile: 0, alternatives: [] };
    }

    // Calculate percentile (where 100 = best)
    const betterCount = allScores.filter(
      (s) => s.overallScore > currentScore.overallScore
    ).length;
    const percentile = Math.round(
      ((allScores.length - betterCount) / allScores.length) * 100
    );

    // Get alternatives
    const alternatives = await findBetterAlternatives(fundId, asOfDate);

    return {
      currentFund: currentScore,
      percentile,
      alternatives,
    };
  } catch (error) {
    console.error("Failed to score fund comparatively:", error);
    return { currentFund: null, percentile: 0, alternatives: [] };
  }
}
