import { PageHeader } from "@/components/page-header";
import { PortfolioOverview } from "@/components/portfolio-overview";
import { HoldingsTable } from "@/components/holdings-table";
import { OptimizationSummary } from "@/components/optimization-summary";
import { db } from "@/db/client";
import { accounts, fundHoldings, funds, optimizationSuggestions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  // Fetch accounts with their holdings
  const allAccounts = await db.select().from(accounts);

  if (allAccounts.length === 0) {
    return (
      <>
        <PageHeader title="Portfolio" caption="Holdings and optimization analysis" />
        <div className="text-center py-12">
          <p className="text-muted">No accounts configured. Go to Settings to add accounts.</p>
        </div>
      </>
    );
  }

  // Use first account (Main 403b)
  const account = allAccounts[0];

  // Fetch holdings for this account
  const holdings = await db
    .select()
    .from(fundHoldings)
    .where(eq(fundHoldings.accountId, account.id));

  // Fetch fund details
  const fundDetails = await db.select().from(funds);
  const fundMap = new Map(fundDetails.map((f) => [f.id, f]));

  // Fetch optimization suggestions for this account
  const suggestions = await db
    .select()
    .from(optimizationSuggestions)
    .where(eq(optimizationSuggestions.accountId, account.id));

  // Map suggestions by current fund ID for quick lookup
  const suggestionMap = new Map(
    suggestions.map((s) => [s.currentFundId, s])
  );

  // Calculate portfolio stats
  let totalBalance = 0;
  let totalWeightedER = 0;
  let totalSavings = 0;
  let lowRiskCount = 0;
  let mediumRiskCount = 0;
  let highRiskCount = 0;

  interface HoldingDisplay {
    fundName: string;
    balance: number;
    allocationPercent: number;
    expenseRatio: number;
    ytdReturn: null;
    isOptimal: boolean;
    suggestedFund?: {
      name: string;
      expenseRatio: number;
      annualSavings: number;
    };
  }
  const holdingsList: HoldingDisplay[] = [];

  for (const holding of holdings) {
    const fund = fundMap.get(holding.fundId);
    if (!fund) continue;

    const er = fund.expenseRatioNet ?? 0;
    totalBalance += holding.balanceAmount;
    totalWeightedER += er * (holding.balanceAmount / 1000000); // Weighted by balance

    // Check if there's a suggestion for this holding
    const suggestion = suggestionMap.get(holding.fundId);
    const suggestedFund = suggestion ? fundMap.get(suggestion.suggestedFundId) : null;

    if (suggestion && suggestedFund) {
      totalSavings += suggestion.estimatedAnnualSavings ?? 0;
      if (suggestion.riskAdjustment === "lower") lowRiskCount++;
      else if (suggestion.riskAdjustment === "none") mediumRiskCount++;
      else if (suggestion.riskAdjustment === "higher") highRiskCount++;
    }

    holdingsList.push({
      fundName: fund.fundName,
      balance: holding.balanceAmount,
      allocationPercent: holding.allocationPercent,
      expenseRatio: er,
      ytdReturn: null,
      isOptimal: !suggestion, // Optimal if no suggestion needed
      ...(suggestion && suggestedFund && {
        suggestedFund: {
          name: suggestedFund.fundName,
          expenseRatio: suggestedFund.expenseRatioNet ?? 0,
          annualSavings: suggestion.estimatedAnnualSavings ?? 0,
        },
      }),
    });
  }

  const avgExpenseRatio = holdings.length > 0 ? (totalBalance > 0 ? (totalWeightedER * 1000000) / totalBalance : 0) : 0;
  const annualFeesEstimate = totalBalance * (avgExpenseRatio / 100);

  const portfolioStats = {
    totalBalance,
    avgExpenseRatio,
    annualFeesEstimate,
    holdingCount: holdings.length,
  };

  const optimizationSummary = {
    totalSuggestions: suggestions.length,
    totalAnnualSavings: totalSavings,
    lowRiskSwaps: lowRiskCount,
    mediumRiskSwaps: mediumRiskCount,
    highRiskSwaps: highRiskCount,
  };

  return (
    <>
      <PageHeader
        title="Portfolio"
        caption={`${account.name} - ${account.taxType?.toUpperCase()}`}
      />

      <div className="space-y-4">
        {/* Portfolio Overview Stats */}
        <PortfolioOverview stats={portfolioStats} />

        {/* Holdings Table with Suggestions */}
        <HoldingsTable holdings={holdingsList} />

        {/* Optimization Summary */}
        <OptimizationSummary summary={optimizationSummary} />
      </div>
    </>
  );
}
