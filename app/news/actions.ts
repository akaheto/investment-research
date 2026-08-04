"use server";

/**
 * News server actions: fetch and store headlines.
 */

import { db } from "@/db/client";
import { newsItems, watchlist, instruments } from "@/db/schema";
import { newsApiProvider } from "@/lib/providers/newsapi";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/tracker";

export async function fetchAndStoreNews() {
  try {
    console.log("📰 Fetching latest news...");

    // Fetch top financial headlines
    const headlines = await newsApiProvider.getTopHeadlines("business");

    if (!headlines || headlines.length === 0) {
      console.log("No headlines found");
      return { ok: true, count: 0 };
    }

    // Store in database
    const stored = [];
    for (const article of headlines.slice(0, 50)) {
      const title = article.title;
      const source = article.source?.name || "Unknown";
      const url = article.url;
      const publishedAt = article.publishedAt;

      // Simple dedupe hash (URL-based)
      const dedupeHash = url;

      try {
        await db
          .insert(newsItems)
          .values({
            title,
            source,
            url,
            publishedAt,
            dedupeHash,
          })
          .onConflictDoNothing();

        stored.push(title);
      } catch (err) {
        console.warn(`Failed to store headline: ${title}`, err);
      }
    }

    console.log(`✓ Stored ${stored.length} headlines`);
    return { ok: true, count: stored.length, headlines: stored };
  } catch (error) {
    console.error("❌ News fetch failed:", error);
    return { ok: false, error: String(error) };
  }
}

export async function getLatestNews(limit = 20) {
  try {
    const items = await db.select().from(newsItems).limit(limit);

    return { ok: true, items: items.reverse() };
  } catch (error) {
    console.error("❌ Failed to fetch news from DB:", error);
    return { ok: false, error: String(error), items: [] };
  }
}

export async function fetchNewsForWatchlist() {
  try {
    console.log("📰 Fetching news for watchlist symbols...");

    // Get all watchlist symbols
    const watchlistItems = await db
      .select({ symbol: instruments.symbol })
      .from(watchlist)
      .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id));

    const symbols = watchlistItems.map((w) => w.symbol);

    if (symbols.length === 0) {
      return { ok: true, count: 0, message: "Watchlist is empty" };
    }

    logAuditEvent({
      eventType: "data_refresh",
      action: "Fetching news for watchlist",
      details: { symbolCount: symbols.length },
    });

    // Fetch news for each symbol
    let stored = 0;
    for (const symbol of symbols) {
      const articles = await newsApiProvider.searchFinancialNews(symbol, 5);

      for (const article of articles) {
        try {
          const dedupeHash = article.url;

          await db
            .insert(newsItems)
            .values({
              title: article.title,
              source: article.source?.name || "Unknown",
              url: article.url,
              publishedAt: article.publishedAt,
              tickersCsv: symbol,
              dedupeHash,
            })
            .onConflictDoNothing();

          stored++;
        } catch (err) {
          console.warn(`Failed to store news for ${symbol}:`, err);
        }
      }
    }

    logAuditEvent({
      eventType: "data_refresh",
      action: "Watchlist news fetched",
      status: "success",
      details: { stored, symbols: symbols.length },
    });

    console.log(`✓ Fetched and stored ${stored} news items`);
    return {
      ok: true,
      count: stored,
      message: `Fetched ${stored} news items for ${symbols.length} symbols`,
    };
  } catch (error) {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Watchlist news fetch failed",
      status: "failed",
      details: { error: String(error) },
    });

    console.error("❌ News fetch failed:", error);
    return { ok: false, error: String(error) };
  }
}
