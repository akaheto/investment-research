import { PageHeader } from "@/components/page-header";
import { PortfolioOverview } from "@/components/portfolio-overview";
import { HoldingsTable } from "@/components/holdings-table";
import { OptimizationSummary } from "@/components/optimization-summary";
import { Card, EmptyState } from "@/components/card";
import { db } from "@/db/client";
import { accounts, fundHoldings, funds, optimizationSuggestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLatestAssessmentForAccount } from "./event-assessment-actions";
import Link from "next/link";

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
  const balanceByAssetClass = new Map<string, number>();

  for (const holding of holdings) {
    const fund = fundMap.get(holding.fundId);
    if (!fund) continue;

    const er = fund.expenseRatioNet ?? 0;
    totalBalance += holding.balanceAmount;
    totalWeightedER += er * (holding.balanceAmount / 1000000); // Weighted by balance

    const assetClass = fund.assetClassSlot ?? "other";
    balanceByAssetClass.set(assetClass, (balanceByAssetClass.get(assetClass) ?? 0) + holding.balanceAmount);

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

  const assetClassLabels: Record<string, string> = {
    us_large_cap: "US Large Cap",
    us_mid_cap: "US Mid Cap",
    us_small_mid_cap: "US Small/Mid Cap",
    bonds: "Bonds",
    bond_core: "Bonds",
    intl: "International",
    intl_developed: "International",
    mm: "Money Market",
    target_date: "Target Date",
    real_estate: "Real Estate",
    other: "Other",
  };
  const allocation = Array.from(balanceByAssetClass.entries())
    .map(([assetClass, balance]) => ({
      category: assetClassLabels[assetClass] ?? assetClass.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      balance,
      pct: totalBalance > 0 ? Math.round((balance / totalBalance) * 100) : 0,
    }))
    .sort((a, b) => b.balance - a.balance);

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

  let assessment: Awaited<ReturnType<typeof getLatestAssessmentForAccount>> = null;
  try {
    assessment = await getLatestAssessmentForAccount(account.id);
  } catch (error) {
    console.error("❌ Failed to load event assessment:", error);
  }

  const riskColor =
    assessment?.riskLevel === "high"
      ? "text-loss"
      : assessment?.riskLevel === "moderate"
        ? "text-warning"
        : "text-gain";

  return (
    <>
      <PageHeader
        title="Portfolio"
        caption={`${account.name} - ${account.taxType?.toUpperCase()}`}
      />

      {allAccounts.length > 1 && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-muted">Accounts:</span>
          {allAccounts.map((a) =>
            a.id === account.id ? (
              <span key={a.id} className="px-2 py-1 rounded bg-accent/10 text-accent font-semibold">
                {a.name}
              </span>
            ) : (
              <Link
                key={a.id}
                href={`/portfolio/${a.id}`}
                className="px-2 py-1 rounded text-muted hover:bg-surface hover:text-ink"
              >
                {a.name}
              </Link>
            ),
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Portfolio Overview Stats */}
        <PortfolioOverview stats={portfolioStats} allocation={allocation} />

        {/* Holdings Table with Suggestions */}
        <HoldingsTable holdings={holdingsList} />

        {/* Optimization Summary */}
        <OptimizationSummary summary={optimizationSummary} />

        {/* Event Impact Assessment (Claude narrative, G5) */}
        <Card title="Event Impact Assessment">
          {assessment ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {assessment.upcomingEventsCount} upcoming event{assessment.upcomingEventsCount === 1 ? "" : "s"} considered
                </span>
                <span className={`font-semibold capitalize ${riskColor}`}>{assessment.riskLevel} risk</span>
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap">{assessment.narrative}</p>
              <div className="text-xs text-muted pt-2 border-t border-hairline">
                Generated {new Date(assessment.generatedAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <EmptyState>
              No event assessment yet — run &quot;G5: Assess Event Impact&quot; in Settings.
            </EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
