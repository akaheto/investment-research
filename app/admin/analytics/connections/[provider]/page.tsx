import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getProviderCallHistory } from "@/lib/audit/tracker";
import { formatTimeEST } from "@/lib/format-time";
import Link from "next/link";

export default async function ProviderDetailPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const calls = await getProviderCallHistory(provider, 30);

  return (
    <>
      <PageHeader
        title={`${provider.toUpperCase()} — API Call History`}
        caption="Last 30 days of API requests to this provider"
      />

      <div className="mb-4">
        <Link href="/admin/analytics" className="text-sm text-accent hover:underline">
          ← Back to Admin Analytics
        </Link>
      </div>

      <Card>
        {calls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-4 py-2 font-semibold text-ink-2">Timestamp</th>
                  <th className="px-4 py-2 font-semibold text-ink-2">Endpoint</th>
                  <th className="px-4 py-2 text-center font-semibold text-ink-2">Method</th>
                  <th className="px-4 py-2 text-center font-semibold text-ink-2">Status</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Duration (ms)</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Records</th>
                  <th className="px-4 py-2 font-semibold text-ink-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, i) => (
                  <tr key={i} className="border-b border-hairline hover:bg-page">
                    <td className="px-4 py-2 text-xs text-muted whitespace-nowrap">
                      {formatTimeEST(call.timestamp)} EST
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-accent truncate">{call.endpoint}</td>
                    <td className="px-4 py-2 text-center text-xs">{call.method}</td>
                    <td className="px-4 py-2 text-center">
                      {call.statusCode ? (
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded font-semibold ${
                            call.statusCode >= 200 && call.statusCode < 300
                              ? "bg-gain/10 text-gain"
                              : "bg-loss/10 text-loss"
                          }`}
                        >
                          {call.statusCode}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-muted">{call.durationMs || "—"}</td>
                    <td className="px-4 py-2 text-right text-xs text-muted">{call.recordsReturned || "—"}</td>
                    <td className="px-4 py-2 text-xs text-loss font-mono truncate">{call.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No API calls to {provider} in the last 30 days</EmptyState>
        )}
      </Card>
    </>
  );
}
