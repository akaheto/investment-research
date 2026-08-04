import { Card } from "@/components/card";

interface OptimizationSummary {
  totalSuggestions: number;
  totalAnnualSavings: number;
  lowRiskSwaps: number;
  mediumRiskSwaps: number;
  highRiskSwaps: number;
}

export function OptimizationSummary({ summary }: { summary: OptimizationSummary }) {
  const allSuggestions = summary.lowRiskSwaps + summary.mediumRiskSwaps + summary.highRiskSwaps;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Quick Summary */}
      <Card className="col-span-12">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted mb-1">Optimization Opportunities</div>
            <div className="text-3xl font-bold text-accent">{summary.totalSuggestions}</div>
            <div className="text-xs text-muted mt-1">fund swaps recommended</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Potential Annual Savings</div>
            <div className="text-3xl font-bold text-gain">${summary.totalAnnualSavings.toFixed(0)}</div>
            <div className="text-xs text-muted mt-1">if all swaps are made</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Risk Profile</div>
            <div className="space-y-1 mt-2">
              <div className="text-xs">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                Low risk: {summary.lowRiskSwaps}
              </div>
              <div className="text-xs">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                Medium: {summary.mediumRiskSwaps}
              </div>
              <div className="text-xs">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                Higher: {summary.highRiskSwaps}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendation Tiers */}
      <Card title="Recommended Swaps by Risk Level" className="col-span-12">
        <div className="space-y-4">
          {/* Low Risk Swaps */}
          {summary.lowRiskSwaps > 0 && (
            <div className="border-l-4 border-green-500 pl-4">
              <div className="font-semibold text-ink mb-1">✓ Low Risk Swaps ({summary.lowRiskSwaps})</div>
              <p className="text-sm text-muted">
                These funds have similar performance profiles but lower expenses. Safe to swap.
              </p>
            </div>
          )}

          {/* Medium Risk Swaps */}
          {summary.mediumRiskSwaps > 0 && (
            <div className="border-l-4 border-yellow-500 pl-4">
              <div className="font-semibold text-ink mb-1">⚠ Medium Risk Swaps ({summary.mediumRiskSwaps})</div>
              <p className="text-sm text-muted">
                Slightly different risk profiles but good cost savings. Review performance history before swapping.
              </p>
            </div>
          )}

          {/* Higher Risk Swaps */}
          {summary.highRiskSwaps > 0 && (
            <div className="border-l-4 border-red-500 pl-4">
              <div className="font-semibold text-ink mb-1">🔴 Higher Risk Swaps ({summary.highRiskSwaps})</div>
              <p className="text-sm text-muted">
                Significant performance differences. Consider consulting a financial advisor before swapping.
              </p>
            </div>
          )}

          {allSuggestions === 0 && (
            <div className="border-l-4 border-green-500 pl-4">
              <div className="font-semibold text-ink mb-1">✓ Portfolio is Optimized</div>
              <p className="text-sm text-muted">
                Your current fund selection is already among the best-in-class options. No changes needed.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Action Items */}
      <Card title="Next Steps" className="col-span-12">
        <ol className="space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="font-bold text-accent">1.</span>
            <span>Review the Holdings & Optimization table above for detailed fund-by-fund recommendations.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-accent">2.</span>
            <span>Start with low-risk swaps first to capture quick savings without significant risk.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-accent">3.</span>
            <span>Consider tax implications if these are taxable accounts (not retirement accounts).</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-accent">4.</span>
            <span>
              Re-run this analysis quarterly to catch new low-cost options as fund companies introduce them.
            </span>
          </li>
        </ol>
      </Card>
    </div>
  );
}
