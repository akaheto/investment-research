"use client";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";

/**
 * G5 Account detail — holdings with scores, swap suggestions, event-overlay narrative.
 * TODO: Load real assessments from database; show Layer 1 scores + Layer 2 narrative.
 */

const mockHoldings = [
  {
    fundName: "Fidelity 500 Index Institutional Prem",
    balance: 286212.69,
    allocation: 36,
    assetClass: "us_large_cap",
    expenseRatio: 0.03,
    compositeScore: 78,
    confidence: "high" as const,
  },
  {
    fundName: "Fidelity International Index",
    balance: 204069.89,
    allocation: 25,
    assetClass: "intl_developed",
    expenseRatio: 0.12,
    compositeScore: 72,
    confidence: "high" as const,
  },
  {
    fundName: "Dodge & Cox Stock X",
    balance: 120546.84,
    allocation: 15,
    assetClass: "us_large_cap",
    expenseRatio: 0.52,
    compositeScore: 70,
    confidence: "medium" as const,
  },
  {
    fundName: "Vanguard Total Bond Market Index I",
    balance: 73841.19,
    allocation: 9,
    assetClass: "bond_core",
    expenseRatio: 0.05,
    compositeScore: 68,
    confidence: "high" as const,
  },
  {
    fundName: "Fidelity Extended Market Index",
    balance: 82203.59,
    allocation: 10,
    assetClass: "us_small_mid_cap",
    expenseRatio: 0.02,
    compositeScore: 75,
    confidence: "high" as const,
  },
];

const eventOverlay = [
  {
    event: "Fed signals rates may hold through Q4 2026",
    direction: "tailwind" as const,
    holdings: ["Vanguard Total Bond Market Index I"],
    note: "Bond yields may stabilize; reduces refinancing risk",
  },
  {
    event: "Concentration risk: Large-cap tech valuations elevated",
    direction: "watch" as const,
    holdings: ["Fidelity 500 Index Institutional Prem", "Dodge & Cox Stock X"],
    note: "Consider increasing small-cap/intl exposure if markets correct",
  },
];

export default function AccountDetailPage({ params }: { params: { accountId: string } }) {
  const totalBalance = mockHoldings.reduce((sum, h) => sum + h.balance, 0);
  const totalExpenses = mockHoldings.reduce((sum, h) => sum + (h.balance * h.expenseRatio) / 100, 0);

  return (
    <>
      <PageHeader
        title={`Account ${params.accountId}`}
        caption="Holdings, scores, and event-overlay narrative"
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Summary */}
        <Card className="col-span-12 lg:col-span-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted mb-1">Total Balance</div>
              <div className="text-2xl font-semibold text-ink">${(totalBalance / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Annual Expenses</div>
              <div className="text-sm text-ink">${totalExpenses.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Avg Expense Ratio</div>
              <div className="text-sm text-ink">{((totalExpenses / totalBalance) * 100 * 100).toFixed(1)} bps</div>
            </div>
          </div>
        </Card>

        {/* Holdings table */}
        <Card title="Holdings" className="col-span-12 lg:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-3 py-2 font-semibold text-ink-2">Fund</th>
                  <th className="px-3 py-2 text-right font-semibold text-ink-2">Balance</th>
                  <th className="px-3 py-2 text-right font-semibold text-ink-2">Score</th>
                  <th className="px-3 py-2 text-right font-semibold text-ink-2">Expense Ratio</th>
                </tr>
              </thead>
              <tbody>
                {mockHoldings
                  .sort((a, b) => b.compositeScore - a.compositeScore)
                  .map((h) => (
                    <tr key={h.fundName} className="border-b border-hairline hover:bg-page">
                      <td className="px-3 py-2 font-mono text-accent">{h.fundName}</td>
                      <td className="px-3 py-2 text-right text-ink">${(h.balance / 1000).toFixed(0)}k</td>
                      <td className="px-3 py-2 text-right">
                        <span className="inline-block bg-gradient-to-r from-loss to-gain px-2 py-1 rounded text-xs font-semibold text-white">
                          {h.compositeScore}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-muted">{(h.expenseRatio * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Event overlay narrative */}
        <Card title="Event Overlay (Layer 2)" className="col-span-12">
          <div className="space-y-3">
            {eventOverlay.map((overlay, i) => (
              <div key={i} className="border-b border-hairline pb-3 last:border-b-0">
                <div className="flex items-start gap-2">
                  <span
                    className={`text-lg ${
                      overlay.direction === "tailwind"
                        ? "text-gain"
                        : overlay.direction === "watch"
                          ? "text-accent"
                          : "text-loss"
                    }`}
                  >
                    {overlay.direction === "tailwind" ? "📈" : overlay.direction === "watch" ? "⚠️" : "📉"}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-ink">{overlay.event}</div>
                    <div className="text-xs text-muted mt-1">{overlay.note}</div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {overlay.holdings.map((h) => (
                        <span key={h} className="inline-block text-xs bg-surface px-2 py-0.5 rounded">
                          {h.split(" ")[0]} {h.split(" ")[1]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
