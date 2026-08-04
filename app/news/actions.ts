"use server";

/**
 * News server actions: fetch and store headlines.
 */

import { db } from "@/db/client";
import { newsItems } from "@/db/schema";
import { newsApiProvider } from "@/lib/providers/newsapi";

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
    const items = await db
      .select()
      .from(newsItems)
      .orderBy(newsItems.publishedAt)
      .limit(limit);

    return { ok: true, items };
  } catch (error) {
    console.error("❌ Failed to fetch news from DB:", error);
    return { ok: false, error: String(error), items: [] };
  }
}
