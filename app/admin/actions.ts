"use server";

/**
 * Admin server actions: manual refresh, data management.
 */

import { logAuditEvent } from "@/lib/audit/tracker";
import { runRefresh } from "@/lib/refresh";
import { computeScoresForWatchlist } from "@/app/screener/actions";
import { fetchNewsForWatchlist } from "@/app/news/actions";
import { getCacheStats, clearExpiredCache } from "@/lib/cache/provider-cache";
import { db } from "@/db/client";
import path from "node:path";

/**
 * One-time/idempotent: applies any pending SQL migrations to whichever
 * database db/client.ts is currently pointed at (dev: file:local.db,
 * prod: Turso via DATABASE_URL/TURSO_DATABASE_URL). Safe to re-run —
 * drizzle skips migrations already recorded as applied.
 */
export async function runMigrations() {
  try {
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    const migrationsFolder = path.join(process.cwd(), "db/migrations");
    console.log(`🔧 Applying migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log("✓ Migrations applied");
    return { ok: true, message: "✅ Migrations applied successfully" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Migration failed:", error);
    return { ok: false, message: `❌ Migration failed: ${errorMsg}` };
  }
}

export async function triggerManualRefresh() {
  let result = { ok: false, message: "❌ Refresh failed: Unknown error" };

  try {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh triggered",
      details: { trigger: "admin_ui" },
    });

    console.log("🔄 Starting manual refresh...");

    // 1. Fetch live prices
    let pricesSymbols = 0;
    try {
      const prices = await runRefresh();
      pricesSymbols = prices.symbols || 0;
      console.log(`✓ Price refresh: ${pricesSymbols} symbols`);
    } catch (priceErr) {
      console.warn("⚠️ Price fetch failed:", priceErr);
    }

    // 2. Compute factor scores
    let scoresCount = 0;
    try {
      const scores = await computeScoresForWatchlist("balanced");
      scoresCount = scores.count || 0;
      console.log(`✓ Scores computed: ${scoresCount} instruments`);
    } catch (scoreErr) {
      console.warn("⚠️ Scores computation failed:", scoreErr);
    }

    // 3. Fetch news for watchlist
    let newsCount = 0;
    try {
      const news = await fetchNewsForWatchlist() as { ok: boolean; count?: number };
      newsCount = news.count || 0;
      console.log(`✓ News fetched: ${newsCount} articles`);
    } catch (newsErr) {
      console.warn("⚠️ News fetch failed:", newsErr);
    }

    const message = `✅ Refresh complete: ${pricesSymbols} prices, ${scoresCount} scores, ${newsCount} news items`;
    result = { ok: true, message };
    console.log(message);

    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh completed",
      status: "success",
      details: { prices: pricesSymbols, scores: scoresCount, news: newsCount },
    });
  } catch (error) {
    const errorMsg = String(error);
    console.error("❌ Refresh failed:", error);

    try {
      logAuditEvent({
        eventType: "data_refresh",
        action: "Manual refresh failed",
        status: "failed",
        details: { error: errorMsg },
      });
    } catch {
      // Ignore audit logging errors
    }

    result = { ok: false, message: `❌ Refresh failed: ${errorMsg}` };
  }

  return result;
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
