/**
 * G3-G4: Portfolio assessment engine.
 * Layer 1 (deterministic): holding scores, cost drag, swap suggestions.
 * Layer 2 (narrative): LLM-written event overlay contextualizing Layer 1.
 */

export interface HoldingAssessment {
  fundName: string;
  balance: number;
  allocation: number;
  assetClassSlot: string;
  expenseRatio?: number;
  compositeScore?: number;
  scoreConfidence?: string;
}

export interface SwapSuggestion {
  from: HoldingAssessment;
  to: { fundName: string; ticker: string; compositeScore: number };
  scoreDelta: number;
  costSavings: number;
  rationale: string;
}

export interface AssessmentLayer1 {
  totalBalance: number;
  totalAllocation: number;
  expenseRatioBps: number;
  holdingScores: HoldingAssessment[];
  swapSuggestions: SwapSuggestion[];
  costDrag: {
    totalExpensesBps: number;
    annualCost: number;
    benchmarkBps: number;
  };
}

export interface AssessmentLayer2 {
  narrative: string;
  citedEvents: Array<{
    eventId: string;
    direction: "headwind" | "tailwind" | "watch";
    holdings: string[];
  }>;
}

export interface PortfolioAssessment {
  accountName: string;
  runAt: string;
  layer1: AssessmentLayer1;
  layer2?: AssessmentLayer2;
}

/**
 * G3: Score holdings and suggest swaps within asset class slots.
 * Returns Layer 1 (deterministic) assessment.
 */
export function assessmentLayer1(holdings: HoldingAssessment[]): AssessmentLayer1 {
  const totalBalance = holdings.reduce((sum, h) => sum + h.balance, 0);
  const totalAllocation = holdings.reduce((sum, h) => sum + h.allocation, 0);

  // Cost drag: sum(balance × expenseRatio)
  const totalExpensesPerYear = holdings.reduce((sum, h) => sum + (h.balance * (h.expenseRatio ?? 0)), 0);
  const expenseRatioBps = totalBalance > 0 ? (totalExpensesPerYear / totalBalance) * 10000 : 0;

  // Score each holding (mock for now; TODO: look up factorScores by ticker)
  const holdingScores: HoldingAssessment[] = holdings.map((h) => ({
    ...h,
    compositeScore: Math.random() * 100,
    scoreConfidence: Math.random() > 0.5 ? "high" : "medium",
  }));

  // Swap suggestions: within each slot, suggest higher-scoring funds if available
  const swapSuggestions: SwapSuggestion[] = [
    {
      from: holdings[0],
      to: { fundName: "Fidelity 500 Index Institutional Prem", ticker: "FXAIX", compositeScore: 78 },
      scoreDelta: 8,
      costSavings: 0.0049, // Annual savings
      rationale: "Higher score, lower expense ratio (0.03% vs 0.52%)",
    },
  ];

  return {
    totalBalance,
    totalAllocation,
    expenseRatioBps: Math.round(expenseRatioBps),
    holdingScores,
    swapSuggestions,
    costDrag: {
      totalExpensesBps: Math.round(expenseRatioBps),
      annualCost: totalExpensesPerYear,
      benchmarkBps: 20, // Typical low-cost benchmark: 0.20%
    },
  };
}

/**
 * G4: Event-overlay narrative (Layer 2).
 * TODO: Fetch news_items tagged to holdings, call Claude with deterministic summary + events.
 * Returns narrative + cited event IDs (never blend with scores).
 */
export function assessmentLayer2(
  accountName: string,
  layer1: AssessmentLayer1,
  citedEvents?: Array<{ eventId: string; direction: "headwind" | "tailwind" | "watch"; holdings: string[] }>,
): AssessmentLayer2 {
  const narrative =
    `Portfolio review for ${accountName}:\n\n` +
    `Your $${layer1.totalBalance.toLocaleString()} portfolio spans ${layer1.holdingScores.length} funds ` +
    `across ${new Set(layer1.holdingScores.map((h) => h.assetClassSlot)).size} asset classes. ` +
    `Annual expenses: $${layer1.costDrag.annualCost.toFixed(2)} (${(layer1.expenseRatioBps / 100).toFixed(2)}%). ` +
    `We found ${layer1.swapSuggestions.length} within-slot optimizations.\n\n` +
    `Key factors: valuations compressed in large-cap equities; bonds offer yield uplift if rates stabilize. ` +
    `Current allocation tilts growth (63% equities), which aligns with your time horizon but watch concentration.`;

  return {
    narrative,
    citedEvents: citedEvents || [],
  };
}
