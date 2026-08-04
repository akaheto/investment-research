"use server";

/**
 * Admin server actions: manual refresh, data management.
 */

import { logAuditEvent } from "@/lib/audit/tracker";
import { runRefresh } from "@/lib/refresh";
import { computeScoresForWatchlist } from "@/app/screener/actions";
import { fetchNewsForWatchlist } from "@/app/news/actions";

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
    const scores = await computeScoresForWatchlist("balanced");
    console.log(`✓ Scores computed: ${scores.count} instruments`);

    // 3. Fetch news for watchlist
    const news = await fetchNewsForWatchlist();
    console.log(`✓ News fetched: ${news.count} articles`);

    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh completed",
      status: "success",
      details: { prices, scores: scores.count, news: news.count },
    });

    return {
      ok: true,
      message: `Refresh complete: ${prices.symbols} prices, ${scores.count} scores, ${news.count} news items`,
      result: { prices, scores, news },
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
