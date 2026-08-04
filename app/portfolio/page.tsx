"use client";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";

/**
 * G5 Portfolio overview — accounts, total balance, allocation, expense drag.
 * TODO: Load from assessments table; show Layer 1 deterministic + Layer 2 narrative.
 */

const mockAccounts = [
  {
    id: 1,
    name: "Transamerica Account 1 (401k)",
    balance: 807659.75,
    allocation: { equities: 86, bonds: 9, other: 5 },
    expenseRatioBps: 18,
    holdingCount: 6,
  },
  {
    id: 2,
    name: "Transamerica Account 2 (IRA)",
    balance: 81585.19,
    allocation: { equities: 92, bonds: 0, other: 8 },
    expenseRatioBps: 22,
    holdingCount: 5,
  },
];

const mockAssessments = {
  1: {
    narrative:
      "Your 401(k) is well-diversified with a balanced 86/9 equity/bond split. Annual expenses are $14.5k (18 bps), below the 50 bps benchmark. Top opportunity: Dodge & Cox is slightly underperforming vs Fidelity 500 on a risk-adjusted basis—consider rebalancing 15% to FXAIX for a cost savings of ~$60/year.",
    suggestions: [
      {
        from: "Dodge & Cox Stock X",
        to: "Fidelity 500 Index",
        scoreDelta: 8,
        costSavings: 60,
      },
    ],
  },
  2: {
    narrative:
      "Your IRA is equity-heavy (92%) and concentrated in large-cap (84%). This is appropriate for growth, but monitor concentration—consider adding small-cap/mid-cap exposure. Current expense ratio is 22 bps, reasonable. No immediate swaps recommended; upcoming market events (Fed rate trajectory) could favor bonds if allocating new contributions.",
    suggestions: [],
  },
};

export default function PortfolioPage() {
  const totalBalance = mockAccounts.reduce((sum, a) => sum + a.balance, 0);
  const avgExpenseRatio = (
    mockAccounts.reduce((sum, a) => sum + a.expenseRatioBps, 0) / mockAccounts.length
  ).toFixed(1);

  return (
    <>
      <PageHeader title="Portfolio" caption="Transamerica accounts, assessment, and recommendations" />

      <div className="grid grid-cols-12 gap-4">
        {/* Summary stats */}
        <Card className="col-span-12 lg:col-span-3">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted mb-1">Total Balance</div>
              <div className="text-2xl font-semibold text-ink">${(totalBalance / 1e6).toFixed(2)}M</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Accounts</div>
              <div className="text-lg font-semibold text-accent">{mockAccounts.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Avg Expense Ratio</div>
              <div className="text-sm text-ink">{avgExpenseRatio} bps</div>
            </div>
          </div>
        </Card>

        {/* Accounts table */}
        <Card title="Accounts" className="col-span-12 lg:col-span-9">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-4 py-2 font-semibold text-ink-2">Account</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Balance</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Equities</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Bonds</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Expense Ratio</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {mockAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-hairline hover:bg-page">
                    <td className="px-4 py-2 font-semibold text-accent">{account.name}</td>
                    <td className="px-4 py-2 text-right text-ink">
                      ${(account.balance / 1000).toFixed(0)}k
                    </td>
                    <td className="px-4 py-2 text-right text-ink">{account.allocation.equities}%</td>
                    <td className="px-4 py-2 text-right text-ink">{account.allocation.bonds}%</td>
                    <td className="px-4 py-2 text-right text-muted">{account.expenseRatioBps} bps</td>
                    <td className="px-4 py-2 text-right">
                      <a href={`/portfolio/${account.id}`} className="text-accent text-xs hover:underline">
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Assessment summaries */}
        {mockAccounts.map((account) => (
          <Card key={account.id} title={`Assessment: ${account.name.split("(")[0].trim()}`} className="col-span-12">
            <div className="space-y-3">
              <p className="text-sm text-ink leading-relaxed">
                {mockAssessments[account.id as keyof typeof mockAssessments]?.narrative}
              </p>
              {mockAssessments[account.id as keyof typeof mockAssessments]?.suggestions.length > 0 && (
                <div className="border-t border-hairline pt-3 mt-3">
                  <div className="text-xs font-semibold text-muted mb-2">Swap Suggestions (within asset class):</div>
                  <div className="space-y-2">
                    {mockAssessments[account.id as keyof typeof mockAssessments]?.suggestions.map((sug, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-surface p-2 rounded">
                        <span className="text-accent font-mono">{sug.from}</span>
                        <span>→</span>
                        <span className="text-accent font-mono">{sug.to}</span>
                        <span className="text-gain ml-auto">
                          +{sug.scoreDelta} score, ${sug.costSavings}/yr
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
