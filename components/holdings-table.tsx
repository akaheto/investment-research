import { Card } from "@/components/card";

interface Holding {
  fundName: string;
  balance: number;
  allocationPercent: number;
  expenseRatio: number;
  ytdReturn: number | null;
  isOptimal: boolean;
  suggestedFund?: {
    name: string;
    expenseRatio: number;
    annualSavings: number;
  };
}

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const sortedHoldings = [...holdings].sort((a, b) => b.balance - a.balance);

  return (
    <Card title="Holdings & Optimization Opportunities" className="col-span-12">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Fund</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-muted">Balance</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-muted">%</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-muted">ER</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-muted">YTD Return</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Status</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted">Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((holding, idx) => (
              <tr key={idx} className="border-b border-hairline last:border-b-0">
                <td className="py-3 px-3">
                  <div className="font-medium text-ink">{holding.fundName}</div>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="text-ink font-medium">${(holding.balance / 1000).toFixed(1)}k</div>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="text-ink">{holding.allocationPercent.toFixed(1)}%</div>
                </td>
                <td className="py-3 px-3 text-right">
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      holding.expenseRatio < 0.1
                        ? "bg-green-100 text-green-800"
                        : holding.expenseRatio < 0.3
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {holding.expenseRatio.toFixed(2)}%
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  {holding.ytdReturn !== null ? (
                    <div className={holding.ytdReturn >= 0 ? "text-gain" : "text-loss"}>
                      {holding.ytdReturn >= 0 ? "+" : ""}
                      {holding.ytdReturn.toFixed(2)}%
                    </div>
                  ) : (
                    <div className="text-muted">—</div>
                  )}
                </td>
                <td className="py-3 px-3">
                  {holding.isOptimal ? (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      ✓ Best-in-class
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠ Consider swap
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  {holding.suggestedFund ? (
                    <div className="text-xs">
                      <div className="text-ink font-medium">→ {holding.suggestedFund.name}</div>
                      <div className="text-gain mt-1">Save ${holding.suggestedFund.annualSavings.toFixed(0)}/yr</div>
                    </div>
                  ) : (
                    <div className="text-muted">—</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
