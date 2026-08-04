"use client";

import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState } from "react";
import type { NewsItem, CalendarEvent } from "@/lib/news/types";

/**
 * E1-E2 News & Events page — headlines with ticker tagging and calendar.
 * TODO: Connect to real news ingestion (E1) and calendar endpoints (E2).
 */

export default function NewsPage() {
  const [headlines, setHeadlines] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/news?limit=10").then((r) => r.json()),
      fetch("/api/calendar").then((r) => r.json()),
    ])
      .then(([newsRes, calRes]) => {
        setHeadlines(newsRes.headlines || []);
        setEvents(calRes.events || []);
      })
      .catch(() => {});
  }, []);

  const sentimentIcon = (sentiment?: string) =>
    sentiment === "positive" ? "📈" : sentiment === "negative" ? "📉" : "📰";

  return (
    <>
      <PageHeader title="News" caption="Headlines and events tagged to your instruments" />

      <div className="grid grid-cols-12 gap-4">
        <Card title="Headlines" className="col-span-12 lg:col-span-8">
          {headlines.length === 0 ? (
            <EmptyState>
              No headlines yet — E1 news ingestion will populate this from SEC EDGAR, Yahoo Finance, and news feeds.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {headlines.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-hairline pb-3 last:border-b-0 hover:bg-page/50 p-2 rounded cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{sentimentIcon(item.sentiment)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink truncate">{item.headline}</div>
                      <div className="text-xs text-muted mt-1">
                        {item.source} • {item.publishedAt.toLocaleDateString()}
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.symbols.map((s) => (
                          <span key={s} className="inline-block text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Upcoming Events" className="col-span-12 lg:col-span-4">
          {events.length === 0 ? (
            <EmptyState>
              No events scheduled — E2 calendar will show earnings, Fed meetings, and macro releases.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div key={evt.id} className="border-b border-hairline pb-3 last:border-b-0">
                  <div className="text-xs text-muted">{evt.date.toLocaleDateString()}</div>
                  <div className="font-semibold text-sm text-ink">{evt.title}</div>
                  <div className="flex gap-1 mt-1">
                    <span className="inline-block text-xs bg-surface px-2 py-1 rounded">
                      {evt.type === "earnings"
                        ? "💼"
                        : evt.type === "fed"
                          ? "🏦"
                          : evt.type === "economic"
                            ? "📊"
                            : "📌"}{" "}
                      {evt.type}
                    </span>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded ${
                        evt.impact === "high"
                          ? "bg-loss/10 text-loss"
                          : evt.impact === "medium"
                            ? "bg-accent/10 text-accent"
                            : "bg-gain/10 text-gain"
                      }`}
                    >
                      {evt.impact} impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
