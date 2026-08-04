"use server";

/**
 * Screener server actions: compute and store factor scores.
 */

import { db } from "@/db/client";
import { instruments, watchlist, factorScores as factorScoresTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/tracker";
import { fetchMetricsForSymbol, fetchMetricsForUniverse } from "@/lib/signals/data-fetcher";
import { computeAllFactors } from "@/lib/signals/factors";
import type { FactorScore } from "@/lib/signals/types";

export async function computeScoresForWatchlist(preset = "balanced") {
  try {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Computing factor scores for watchlist",
      details: { preset },
    });

    // Get all watchlist items
    const watchlistItems = await db
      .select({
        instrumentId: watchlist.instrumentId,
        symbol: instruments.symbol,
        sector: instruments.sector,
      })
      .from(watchlist)
      .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id));

    if (watchlistItems.length === 0) {
      return { ok: true, count: 0, message: "Watchlist is empty" };
    }

    // Fetch metrics for universe (all watchlist items)
    const symbols = watchlistItems.map((w) => w.symbol);
    const universe = await fetchMetricsForUniverse(symbols);

    const runAt = new Date().toISOString();
    const scores = [];

    // Compute scores for each watchlist item
    for (let i = 0; i < watchlistItems.length; i++) {
      const item = watchlistItems[i];
      const metrics = universe[i] || {};

      try {
        // Compute all factors
        const computedScores: FactorScore = computeAllFactors(metrics, universe, item.sector || undefined);

        // Store each factor score in database
        for (const [factor, score] of Object.entries(computedScores)) {
          await db
            .insert(factorScoresTable)
            .values({
              instrumentId: item.instrumentId,
              runAt,
              factor: factor as "valuation" | "growth" | "quality" | "momentum",
              percentile: score as number,
              weightsPresetId: preset,
              confidence: "medium",
            })
            .onConflictDoNothing();
        }

        // Compute composite score
        const composite =
          (computedScores.valuation +
            computedScores.growth +
            computedScores.quality +
            computedScores.momentum) /
          4;

        await db
          .insert(factorScoresTable)
          .values({
            instrumentId: item.instrumentId,
            runAt,
            factor: "composite",
            percentile: composite,
            weightsPresetId: preset,
            confidence: "medium",
          })
          .onConflictDoNothing();

        scores.push({ symbol: item.symbol, scores: computedScores });
      } catch (err) {
        console.error(`Failed to compute scores for ${item.symbol}:`, err);
      }
    }

    logAuditEvent({
      eventType: "data_refresh",
      action: "Factor scores computed",
      status: "success",
      details: { preset, count: scores.length },
    });

    return { ok: true, count: scores.length, scores };
  } catch (error) {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Factor score computation failed",
      status: "failed",
      details: { error: String(error) },
    });

    return { ok: false, error: String(error) };
  }
}

export async function getScoresForInstrument(instrumentId: number) {
  try {
    const scores = await db
      .select()
      .from(factorScoresTable)
      .where(eq(factorScoresTable.instrumentId, instrumentId));

    // Get latest scores by factor
    const latest: Record<string, (typeof scores)[0]> = {};
    for (const score of scores) {
      const key = score.factor;
      if (!latest[key] || score.runAt > latest[key].runAt) {
        latest[key] = score;
      }
    }

    return { ok: true, scores: Object.values(latest) };
  } catch (error) {
    return { ok: false, error: String(error), scores: [] };
  }
}
