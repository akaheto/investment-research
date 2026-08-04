"use server";

import { db } from "@/db/client";
import { fundHoldings, funds, optimizationSuggestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { findBetterAlternatives } from "./scoring-actions";

interface Suggestion {
  accountId: number;
  currentFundId: number;
  suggestedFundId: number;
  currentFundName: string;
  suggestedFundName: string;
  currentBalance: number;
  currentER: number;
  suggestedER: number;
  reason: "lower_expense_ratio" | "better_performance" | "similar_allocation_lower_cost";
  estimatedAnnualSavings: number;
  riskAdjustment: "none" | "higher" | "lower";
  impactPercentage: number; // % improvement in annual returns due to lower costs
}

/**
 * Generate optimization suggestions for an account
 * Analyzes all holdings and recommends swaps to lower-cost or better-performing alternatives
 */
export async function generateSuggestionsForAccount(
  accountId: number,
  asOfDate: string = "2026-07-31"
): Promise<{
  ok: boolean;
  suggestions?: Suggestion[];
  totalAnnualSavings?: number;
  message?: string;
}> {
  try {
    // Get account's holdings
    const holdings = await db
      .select({
        holdingId: fundHoldings.id,
        fundId: fundHoldings.fundId,
        balance: fundHoldings.balanceAmount,
        allocationPercent: fundHoldings.allocationPercent,
      })
      .from(fundHoldings)
      .where(and(eq(fundHoldings.accountId, accountId), eq(fundHoldings.asOf, asOfDate)));

    if (holdings.length === 0) {
      return { ok: true, suggestions: [], totalAnnualSavings: 0, message: "No holdings found" };
    }

    // Get fund details for all holdings
    const fundDetails = await db.select().from(funds);
    const fundMap = new Map(fundDetails.map((f) => [f.id, f]));

    const suggestions: Suggestion[] = [];
    let totalSavings = 0;

    // Analyze each holding
    for (const holding of holdings) {
      const currentFund = fundMap.get(holding.fundId);
      if (!currentFund) continue;

      // Find better alternatives
      const alternatives = await findBetterAlternatives(holding.fundId, asOfDate);

      if (alternatives.length === 0) {
        // Fund is already best-in-class or no alternatives available
        continue;
      }

      // Use top alternative
      const bestAlternative = alternatives[0];
      const suggestedFund = fundMap.get(bestAlternative.fundId);
      if (!suggestedFund) continue;

      // Calculate savings
      const currentER = currentFund.expenseRatioNet ?? 0;
      const suggestedER = suggestedFund.expenseRatioNet ?? 0;
      const erDifference = currentER - suggestedER;

      // Skip if no meaningful cost difference
      if (erDifference <= 0.05) {
        continue;
      }

      const annualSavings = holding.balance * erDifference;

      // Determine reason
      let reason: "lower_expense_ratio" | "better_performance" | "similar_allocation_lower_cost";
      if (bestAlternative.costScore > 80 && bestAlternative.performanceScore > 70) {
        reason = "similar_allocation_lower_cost";
      } else if (erDifference > 0.3) {
        reason = "lower_expense_ratio";
      } else {
        reason = "similar_allocation_lower_cost";
      }

      // Determine risk adjustment based on performance comparison
      let riskAdjustment: "none" | "higher" | "lower" = "none";
      if (bestAlternative.performanceMatch < 50) {
        riskAdjustment = "higher"; // Less similar performance = higher risk
      } else if (bestAlternative.performanceMatch > 85) {
        riskAdjustment = "lower"; // Very similar performance = lower risk
      }

      const impactPercentage = currentER > 0 ? (erDifference / currentER) * 100 : 0;

      suggestions.push({
        accountId,
        currentFundId: holding.fundId,
        suggestedFundId: bestAlternative.fundId,
        currentFundName: currentFund.fundName,
        suggestedFundName: suggestedFund.fundName,
        currentBalance: holding.balance,
        currentER: currentER,
        suggestedER: suggestedER,
        reason,
        estimatedAnnualSavings: Math.round(annualSavings * 100) / 100,
        riskAdjustment,
        impactPercentage: Math.round(impactPercentage),
      });

      totalSavings += annualSavings;
    }

    // Save suggestions to database
    for (const suggestion of suggestions) {
      await db
        .insert(optimizationSuggestions)
        .values({
          accountId,
          currentFundId: suggestion.currentFundId,
          suggestedFundId: suggestion.suggestedFundId,
          reason: suggestion.reason,
          estimatedAnnualSavings: suggestion.estimatedAnnualSavings,
          riskAdjustment: suggestion.riskAdjustment,
          createdAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
    }

    return {
      ok: true,
      suggestions,
      totalAnnualSavings: Math.round(totalSavings * 100) / 100,
      message: `Generated ${suggestions.length} suggestions, potential annual savings: $${totalSavings.toFixed(2)}`,
    };
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return { ok: false, message: String(error) };
  }
}

/**
 * Get stored suggestions for an account
 */
export async function getSuggestionsForAccount(accountId: number): Promise<Suggestion[]> {
  try {
    const stored = await db
      .select({
        accountId: optimizationSuggestions.accountId,
        currentFundId: optimizationSuggestions.currentFundId,
        suggestedFundId: optimizationSuggestions.suggestedFundId,
        reason: optimizationSuggestions.reason,
        estimatedAnnualSavings: optimizationSuggestions.estimatedAnnualSavings,
        riskAdjustment: optimizationSuggestions.riskAdjustment,
      })
      .from(optimizationSuggestions)
      .where(eq(optimizationSuggestions.accountId, accountId));

    // Enrich with fund names
    const fundDetails = await db.select().from(funds);
    const fundMap = new Map(fundDetails.map((f) => [f.id, f]));

    return stored
      .map((s) => {
        const currentFund = fundMap.get(s.currentFundId);
        const suggestedFund = fundMap.get(s.suggestedFundId);
        if (!currentFund || !suggestedFund) return null;

        return {
          accountId: s.accountId,
          currentFundId: s.currentFundId,
          suggestedFundId: s.suggestedFundId,
          currentFundName: currentFund.fundName,
          suggestedFundName: suggestedFund.fundName,
          currentBalance: 0, // Would need to join with holdings to get this
          currentER: currentFund.expenseRatioNet ?? 0,
          suggestedER: suggestedFund.expenseRatioNet ?? 0,
          reason: s.reason as "lower_expense_ratio" | "better_performance" | "similar_allocation_lower_cost",
          estimatedAnnualSavings: s.estimatedAnnualSavings || 0,
          riskAdjustment: s.riskAdjustment as "none" | "higher" | "lower",
          impactPercentage: 0, // Would need to calculate
        };
      })
      .filter((s): s is Suggestion => s !== null);
  } catch (error) {
    console.error("Failed to get suggestions:", error);
    return [];
  }
}

/**
 * Clear old suggestions and regenerate
 */
export async function refreshSuggestionsForAccount(
  accountId: number,
  asOfDate: string = "2026-07-31"
): Promise<{
  ok: boolean;
  suggestions?: Suggestion[];
  totalAnnualSavings?: number;
  message?: string;
}> {
  try {
    // Clear existing suggestions
    await db.delete(optimizationSuggestions).where(eq(optimizationSuggestions.accountId, accountId));

    // Generate new suggestions
    return await generateSuggestionsForAccount(accountId, asOfDate);
  } catch (error) {
    console.error("Failed to refresh suggestions:", error);
    return { ok: false, message: String(error) };
  }
}
