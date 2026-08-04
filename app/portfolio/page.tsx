import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getPortfolioOverview } from "./actions";

export default async function PortfolioPage() {
  const portfolio = await getPortfolioOverview();
  const hasAccounts = portfolio.accounts.length > 0;

  const avgExpenseRatio = (portfolio.costDragBps).toFixed(1);

  return (
    <>
      <PageHeader title="Portfolio" caption="Transamerica accounts, assessment, and recommendations" />

      {!hasAccounts ? (
        <Card>
          <EmptyState>
            No portfolio accounts configured yet. To set up your portfolio, you can add Transamerica account data via CSV
            import in the Admin section. Portfolio features include: allocation tracking, expense ratio analysis, and
            fund swap recommendations.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* Summary stats */}
          <Card className="col-span-12 lg:col-span-3">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted mb-1">Total Balance</div>
                <div className="text-2xl font-semibold text-ink">${(portfolio.totalBalance / 1e6).toFixed(2)}M</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Accounts</div>
                <div className="text-lg font-semibold text-accent">{portfolio.accounts.length}</div>
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
                  {portfolio.accounts.map((account) => (
                    <tr key={account.id} className="border-b border-hairline hover:bg-page">
                      <td className="px-4 py-2 font-semibold text-accent">{account.name}</td>
                      <td className="px-4 py-2 text-right text-ink">
                        ${(account.balance / 1000).toFixed(0)}k
                      </td>
                      <td className="px-4 py-2 text-right text-ink">{Math.round(account.allocation.equities)}%</td>
                      <td className="px-4 py-2 text-right text-ink">{Math.round(account.allocation.bonds)}%</td>
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

          {/* Combined allocation */}
          <Card title="Combined Allocation" className="col-span-12">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-ink">{portfolio.combinedAllocation.equities}%</div>
                <div className="text-xs text-muted">Equities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-ink">{portfolio.combinedAllocation.bonds}%</div>
                <div className="text-xs text-muted">Bonds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-ink">{portfolio.combinedAllocation.other}%</div>
                <div className="text-xs text-muted">Other</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
