import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { RefreshButton } from "../refresh-button";
import { getApiStats, getRecentImports, getRecentEvents } from "@/lib/audit/tracker";

/**
 * Admin Analytics — API usage, imports, system health.
 */

export default async function AdminAnalyticsPage() {
  const [apiStats, imports, events] = await Promise.all([
    getApiStats(24),
    getRecentImports(20),
    getRecentEvents(20),
  ]);

  return (
    <>
      <PageHeader title="Admin Analytics" caption="API usage, imports, and system events" />

      <div className="mb-6">
        <Card title="System Control" className="col-span-12">
          <div className="space-y-2">
            <p className="text-sm text-muted mb-3">
              Cron job runs daily at 3:00 AM UTC. Trigger manual refresh below:
            </p>
            <RefreshButton />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* API Usage by Provider */}
        <Card title="API Calls (Last 24h)" className="col-span-12 lg:col-span-6">
          {apiStats.ok && Object.keys(apiStats.byProvider).length > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-muted mb-3">
                <span>Total: {apiStats.totalCalls}</span>
              </div>
              {Object.entries(apiStats.byProvider).map(([provider, stats]) => (
                <div key={provider} className="border-b border-hairline pb-3 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm capitalize">{provider}</span>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">{stats.count}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                    <div>
                      Errors: <span className={stats.errors > 0 ? "text-loss" : "text-gain"}>{stats.errors}</span>
                    </div>
                    <div>Avg: {stats.avgDuration.toFixed(0)}ms</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No API calls yet</EmptyState>
          )}
        </Card>

        {/* Recent Imports */}
        <Card title="File Imports" className="col-span-12 lg:col-span-6">
          {imports.ok && imports.imports.length > 0 ? (
            <div className="space-y-3">
              {imports.imports.map((imp, i) => (
                <div key={i} className="border-b border-hairline pb-3 last:border-b-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{imp.filename}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {new Date(imp.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded ml-2 ${
                        imp.status === "success"
                          ? "bg-gain/10 text-gain"
                          : "bg-loss/10 text-loss"
                      }`}
                    >
                      {imp.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    {imp.recordsProcessed} records
                    {imp.recordsFailed ? ` · ${imp.recordsFailed} failed` : ""}
                  </div>
                  {imp.error && <div className="text-xs text-loss mt-1">{imp.error}</div>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No imports yet</EmptyState>
          )}
        </Card>

        {/* System Events */}
        <Card title="Recent Events" className="col-span-12">
          {events.ok && events.events.length > 0 ? (
            <div className="space-y-3">
              {events.events.map((evt, i) => (
                <div key={i} className="border-b border-hairline pb-3 last:border-b-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{evt.action}</div>
                      <div className="text-xs text-muted mt-0.5">
                        <span className="capitalize inline-block bg-surface px-2 py-0.5 rounded mr-2">
                          {evt.eventType}
                        </span>
                        {new Date(evt.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded ml-2 ${
                        evt.status === "success"
                          ? "bg-gain/10 text-gain"
                          : "bg-loss/10 text-loss"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>
                  {evt.details && (
                    <div className="text-xs text-muted mt-1 font-mono bg-surface p-2 rounded overflow-x-auto">
                      {evt.details.substring(0, 120)}
                      {evt.details.length > 120 ? "..." : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No events yet</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
