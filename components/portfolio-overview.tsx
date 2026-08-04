import { Card } from "@/components/card";

interface PortfolioStats {
  totalBalance: number;
  avgExpenseRatio: number;
  annualFeesEstimate: number;
  holdingCount: number;
}

export async function PortfolioOverview({ stats }: { stats: PortfolioStats }) {
  const allocationByCategory = [
    { category: "US Large Cap", pct: 35, balance: stats.totalBalance * 0.35 },
    { category: "International", pct: 25, balance: stats.totalBalance * 0.25 },
    { category: "US Mid Cap", pct: 20, balance: stats.totalBalance * 0.20 },
    { category: "Bonds", pct: 12, balance: stats.totalBalance * 0.12 },
    { category: "Real Estate", pct: 8, balance: stats.totalBalance * 0.08 },
  ];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Summary Stats */}
      <Card className="col-span-12">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted mb-1">Total Balance</div>
            <div className="text-2xl font-bold text-ink">${(stats.totalBalance / 1000).toFixed(0)}k</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Avg Expense Ratio</div>
            <div className="text-2xl font-bold text-ink">{stats.avgExpenseRatio.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Annual Fees</div>
            <div className="text-2xl font-bold text-ink">${stats.annualFeesEstimate.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Holdings</div>
            <div className="text-2xl font-bold text-ink">{stats.holdingCount}</div>
          </div>
        </div>
      </Card>

      {/* Allocation Breakdown */}
      <Card title="Asset Allocation" className="col-span-12 lg:col-span-6">
        <div className="space-y-3">
          {allocationByCategory.map((category) => (
            <div key={category.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-ink font-medium">{category.category}</span>
                <span className="text-sm text-muted">${(category.balance / 1000).toFixed(0)}k</span>
              </div>
              <div className="w-full bg-surface rounded h-2">
                <div
                  className="bg-accent h-2 rounded"
                  style={{ width: `${category.pct}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted text-right mt-0.5">{category.pct}%</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Fee Impact */}
      <Card title="Fee Analysis" className="col-span-12 lg:col-span-6">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted mb-1">Estimated Annual Fees</div>
            <div className="text-2xl font-bold text-ink">${stats.annualFeesEstimate.toFixed(0)}</div>
            <p className="text-xs text-muted mt-2">
              Based on {stats.avgExpenseRatio.toFixed(2)}% average expense ratio
            </p>
          </div>
          <div className="pt-2 border-t border-hairline">
            <p className="text-xs text-muted">
              💡 <strong>Low-cost optimization</strong> could save 50-80% on fees with similar
              performance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
