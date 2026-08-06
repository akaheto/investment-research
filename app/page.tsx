import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { SectorDonut } from "@/components/sector-donut";
import { getMarketIndices } from "./markets/actions";
import { getWatchlistWithQuotes } from "./watchlist/actions";
import { getLatestNews } from "./news/actions";
import { getLastRefreshSummary } from "@/lib/audit/tracker";
import { getSectorBreakdown } from "./dashboard/actions";
import { formatRelativeTime } from "@/lib/format-time";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** Dashboard — market overview, watchlist snapshot, and latest headlines. */
export default async function DashboardPage() {
  let indices: Awaited<ReturnType<typeof getMarketIndices>> = [];
  let watchlist: Awaited<ReturnType<typeof getWatchlistWithQuotes>> = [];
  let news: Awaited<ReturnType<typeof getLatestNews>> = { ok: false, items: [] };
  let lastRefreshAt: string | null = null;
  let sectorBreakdown: Awaited<ReturnType<typeof getSectorBreakdown>> = [];

  try {
    const results = await Promise.all([
      getMarketIndices(),
      getWatchlistWithQuotes(),
      getLatestNews(5),
      getLastRefreshSummary(),
      getSectorBreakdown(),
    ]);
    indices = results[0];
    watchlist = results[1];
    news = results[2];
    lastRefreshAt = results[3].lastRefreshAt;
    sectorBreakdown = results[4];
  } catch (error) {
    console.error("❌ Failed to load dashboard data:", error);
  }

  const headlines = news.ok ? news.items.slice(0, 5) : [];
  const refreshStatusText = lastRefreshAt ? `Last updated ${formatRelativeTime(lastRefreshAt)}` : "No data yet";

  return (
    <>
      <PageHeader
        title="Dashboard"
        caption="Market overview, your accounts, and what changed"
        actions={
          <div className="text-right">
            <div className="text-xs text-muted">{refreshStatusText}</div>
            <div className="text-xs text-muted mt-0.5">Next: 3:00 AM UTC</div>
          </div>
        }
      />
      <div className="grid grid-cols-12 gap-4">
        <Card title="Markets" className="col-span-12 lg:col-span-8">
          {indices.length > 0 ? (
            <div className="space-y-2">
              {indices.map((idx) => (
                <div key={idx.symbol} className="flex items-baseline justify-between">
                  <span className="font-mono text-sm font-semibold text-ink">{idx.symbol}</span>
                  <span className="text-sm text-ink">${idx.price.toFixed(2)}</span>
                  <span className={`text-xs ${idx.change >= 0 ? "text-gain" : "text-loss"}`}>
                    {idx.changePercent >= 0 ? "+" : ""}
                    {idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
              <Link href="/markets" className="text-xs text-accent hover:underline inline-block pt-2">
                View all markets →
              </Link>
            </div>
          ) : (
            <EmptyState>No market data yet — run Admin &gt; Trigger Manual Refresh.</EmptyState>
          )}
        </Card>
        <Card title="Watchlist" className="col-span-12 lg:col-span-4">
          {watchlist.length > 0 ? (
            <div className="space-y-2">
              {watchlist.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-baseline justify-between">
                  <span className="font-mono text-sm font-semibold text-accent">{item.symbol}</span>
                  <span className="text-sm text-ink">${item.price.toFixed(2)}</span>
                </div>
              ))}
              <Link href="/watchlist" className="text-xs text-accent hover:underline inline-block pt-2">
                View full watchlist →
              </Link>
            </div>
          ) : (
            <EmptyState>Empty — add instruments under Watchlist.</EmptyState>
          )}
        </Card>
        <Card title="Sector Composition" className="col-span-12 lg:col-span-4">
          <SectorDonut data={sectorBreakdown} />
        </Card>
        <Card title="News" className="col-span-12">
          {headlines.length > 0 ? (
            <div className="space-y-2">
              {headlines.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-ink truncate">{item.title}</span>
                  <span className="text-xs text-muted whitespace-nowrap">{item.source}</span>
                </div>
              ))}
              <Link href="/news" className="text-xs text-accent hover:underline inline-block pt-2">
                View all headlines →
              </Link>
            </div>
          ) : (
            <EmptyState>No headlines yet — go to Admin &gt; Trigger Manual Refresh.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
