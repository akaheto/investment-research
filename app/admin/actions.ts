"use server";

/**
 * Admin server actions: manual refresh, data management.
 */

import { logAuditEvent } from "@/lib/audit/tracker";
import { runRefresh } from "@/lib/refresh";
import { computeScoresForWatchlist } from "@/app/screener/actions";
import { fetchNewsForWatchlist } from "@/app/news/actions";
import { getCacheStats, clearExpiredCache } from "@/lib/cache/provider-cache";

export async function triggerManualRefresh() {
  try {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh triggered",
      details: { trigger: "admin_ui" },
    });

    console.log("🔄 Starting manual refresh...");

    // 1. Fetch live prices
    const prices = await runRefresh();
    console.log(`✓ Price refresh: ${prices.symbols} symbols, ${prices.observations} observations`);

    // 2. Compute factor scores
    let scoresCount = 0;
    try {
      const scores = await computeScoresForWatchlist("balanced");
      scoresCount = scores.count;
      console.log(`✓ Scores computed: ${scoresCount} instruments`);
    } catch (scoreErr) {
      console.warn("⚠️ Scores computation failed:", scoreErr);
    }

    // 3. Fetch news for watchlist
    let newsCount = 0;
    try {
      const news = await fetchNewsForWatchlist();
      newsCount = (news as any).count || 0;
      console.log(`✓ News fetched: ${newsCount} articles`);
    } catch (newsErr) {
      console.warn("⚠️ News fetch failed:", newsErr);
    }

    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh completed",
      status: "success",
      details: { prices, scores: scoresCount, news: newsCount },
    });

    return {
      ok: true,
      message: `Refresh complete: ${prices.symbols} prices, ${scoresCount} scores, ${newsCount} news items`,
      result: { prices, scoresCount, newsCount },
    };
  } catch (error) {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh failed",
      status: "failed",
      details: { error: String(error) },
    });

    console.error("❌ Refresh failed:", error);
    return { ok: false, error: String(error) };
  }
}

export async function getCacheStatus() {
  try {
    const stats = await getCacheStats();
    return { ok: true, stats };
  } catch (err) {
    console.error("Failed to get cache stats:", err);
    return { ok: false, error: String(err) };
  }
}

export async function clearStaleCache() {
  try {
    const cleared = await clearExpiredCache();
    logAuditEvent({
      eventType: "data_refresh",
      action: "Cleared expired cache entries",
      details: { cleared },
    });
    return { ok: true, cleared };
  } catch (err) {
    console.error("Failed to clear cache:", err);
    return { ok: false, error: String(err) };
  }
}
