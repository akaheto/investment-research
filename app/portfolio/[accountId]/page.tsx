import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/client";
import { accounts, fundHoldings, funds, optimizationSuggestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLatestAssessmentForAccount } from "../event-assessment-actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Account detail — holdings and optimization status for a single account,
 * plus the Claude-generated event impact narrative (G5).
 */
export default async function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId: accountIdParam } = await params;
  const accountId = Number(accountIdParam);

  if (!Number.isFinite(accountId)) {
    return (
      <>
        <PageHeader title="Account not found" caption="Holdings and optimization analysis" />
        <Card>
          <EmptyState>&quot;{accountIdParam}&quot; is not a valid account id.</EmptyState>
        </Card>
      </>
    );
  }

  const accountRows = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (accountRows.length === 0) {
    return (
      <>
        <PageHeader title="Account not found" caption="Holdings and optimization analysis" />
        <Card>
          <EmptyState>No account with id {accountId}.</EmptyState>
        </Card>
      </>
    );
  }
  const account = accountRows[0];
  const allAccounts = await db.select().from(accounts);

  const holdings = await db.select().from(fundHoldings).where(eq(fundHoldings.accountId, accountId));
  const fundDetails = await db.select().from(funds);
  const fundMap = new Map(fundDetails.map((f) => [f.id, f]));

  const suggestions = await db
    .select()
    .from(optimizationSuggestions)
    .where(eq(optimizationSuggestions.accountId, accountId));
  const suggestionMap = new Map(suggestions.map((s) => [s.currentFundId, s]));

  const totalBalance = holdings.reduce((sum, h) => sum + h.balanceAmount, 0);
  const totalExpenses = holdings.reduce((sum, h) => {
    const fund = fundMap.get(h.fundId);
    return sum + (h.balanceAmount * (fund?.expenseRatioNet ?? 0)) / 100;
  }, 0);

  let assessment: Awaited<ReturnType<typeof getLatestAssessmentForAccount>> = null;
  try {
    assessment = await getLatestAssessmentForAccount(accountId);
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
        title={account.name}
        caption={`Holdings and optimization — ${account.taxType?.toUpperCase()}`}
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

      <div className="grid grid-cols-12 gap-4">
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
              <div className="text-sm text-ink">
                {totalBalance > 0 ? ((totalExpenses / totalBalance) * 100 * 100).toFixed(1) : "0.0"} bps
              </div>
            </div>
          </div>
        </Card>

        <Card title="Holdings" className="col-span-12 lg:col-span-8">
          {holdings.length === 0 ? (
            <EmptyState>No holdings for this account.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-hairline text-left">
                    <th className="px-3 py-2 font-semibold text-ink-2">Fund</th>
                    <th className="px-3 py-2 text-right font-semibold text-ink-2">Balance</th>
                    <th className="px-3 py-2 text-right font-semibold text-ink-2">Expense Ratio</th>
                    <th className="px-3 py-2 text-right font-semibold text-ink-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...holdings]
                    .sort((a, b) => b.balanceAmount - a.balanceAmount)
                    .map((h) => {
                      const fund = fundMap.get(h.fundId);
                      const hasSuggestion = suggestionMap.has(h.fundId);
                      return (
                        <tr key={h.id} className="border-b border-hairline hover:bg-page">
                          <td className="px-3 py-2 text-ink">{fund?.fundName ?? "Unknown fund"}</td>
                          <td className="px-3 py-2 text-right text-ink">${(h.balanceAmount / 1000).toFixed(0)}k</td>
                          <td className="px-3 py-2 text-right text-muted">{(fund?.expenseRatioNet ?? 0).toFixed(2)}%</td>
                          <td className="px-3 py-2 text-right">
                            {hasSuggestion ? (
                              <span className="text-warning">⚠ Consider swap</span>
                            ) : (
                              <span className="text-gain">✓ Best-in-class</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Event Impact Assessment" className="col-span-12">
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
