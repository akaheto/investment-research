import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getLatestNews } from "./actions";
import { analyzeSentiment, sentimentIcon } from "@/lib/sentiment/analyzer";
import { formatTimeEST } from "@/lib/format-time";

export const dynamic = "force-dynamic";

/**
 * News page (server-side) — real headlines with sentiment analysis.
 * Fetches from newsItems table (populated by admin refresh).
 */

export default async function NewsPage() {
  const newsResult = await getLatestNews(30);
  const headlines = newsResult.ok ? newsResult.items : [];

  return (
    <>
      <PageHeader title="News" caption="Headlines for watchlist symbols" />

      <div className="grid grid-cols-12 gap-4">
        <Card title="Headlines" className="col-span-12">
          {headlines.length === 0 ? (
            <EmptyState>
              No headlines yet — go to Admin {`>`} Refresh to fetch news for watchlist symbols.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {headlines.map((item) => {
                const { sentiment } = analyzeSentiment(item.title);

                return (
                  <div
                    key={item.id}
                    className="border-b border-hairline pb-3 last:border-b-0 hover:bg-page/50 p-2 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{sentimentIcon(sentiment)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-ink truncate">{item.title}</div>
                        <div className="text-xs text-muted mt-1">
                          {item.source} •{" "}
                          {formatTimeEST(item.publishedAt as string)} EST
                        </div>
                        {item.tickersCsv && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {item.tickersCsv.split(",").map((symbol) => (
                              <span
                                key={symbol.trim()}
                                className="inline-block text-xs bg-accent/10 text-accent px-2 py-0.5 rounded"
                              >
                                {symbol.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline mt-1 shrink-0"
                      >
                        Read
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
