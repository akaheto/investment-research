"use server";

import { db } from "@/db/client";
import { instruments, watchlist, factorScores, pricesDaily } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { fetchMetricsForSymbol } from "@/lib/signals/data-fetcher";
import {
  computeValuationFactor,
  computeGrowthFactor,
  computeQualityFactor,
  computeMomentumFactor,
} from "@/lib/signals/factors";
import { computeCompositeScore } from "@/lib/scoring/composer";

export interface ScreenerResult {
  id: number;
  symbol: string;
  name: string;
  compositeScore: number;
  preset: string;
  valuation: number;
  growth: number;
  quality: number;
  momentum: number;
  confidence: string;
  sparkline?: number[];
}

/**
 * Compute and store factor scores for all watchlist instruments.
 * Fetches real fundamentals/technicals per symbol, ranks each against the
 * rest of the watchlist (the "universe"), and persists valuation/growth/
 * quality/momentum percentiles to factorScores. Returns count of scored
 * instruments.
 */
export async function computeScoresForWatchlist(presetName: string = "balanced"): Promise<{ count: number }> {
  const watchlistItems = await db
    .select({
      id: instruments.id,
      symbol: instruments.symbol,
      sector: instruments.sector,
    })
    .from(watchlist)
    .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id));

  if (watchlistItems.length === 0) {
    return { count: 0 };
  }

  // Fetch raw metrics for every watchlist symbol once — used both as each
  // instrument's own metrics and as the comparison universe for percentiles.
  const metricsBySymbol = new Map(
    await Promise.all(
      watchlistItems.map(async (item) => [item.symbol, await fetchMetricsForSymbol(item.symbol, item.sector ?? undefined)] as const),
    ),
  );
  const universe = Array.from(metricsBySymbol.values());
  const runAt = new Date().toISOString();
  let scoredCount = 0;

  for (const item of watchlistItems) {
    const raw = metricsBySymbol.get(item.symbol);
    if (!raw) continue;

    const factorResults = {
      valuation: computeValuationFactor(raw, universe, item.sector ?? undefined),
      growth: computeGrowthFactor(raw, universe),
      quality: computeQualityFactor(raw, universe, item.sector ?? undefined),
      momentum: computeMomentumFactor(raw, universe),
    };

    for (const [factor, result] of Object.entries(factorResults)) {
      await db.insert(factorScores).values({
        instrumentId: item.id,
        runAt,
        factor,
        rawScore: result.score,
        percentile: result.score,
        weightsPresetId: presetName,
        confidence: result.confidence,
      });
    }

    const composite = computeCompositeScore(
      {
        valuation: factorResults.valuation.score,
        growth: factorResults.growth.score,
        quality: factorResults.quality.score,
        momentum: factorResults.momentum.score,
      },
      presetName,
    );
    await db.insert(factorScores).values({
      instrumentId: item.id,
      runAt,
      factor: "composite",
      rawScore: composite.compositeScore,
      percentile: composite.compositeScore,
      weightsPresetId: presetName,
      confidence: composite.confidence === "full" ? "full" : "low",
    });
    scoredCount++;
  }

  return { count: scoredCount };
}

/**
 * Get screener results from watchlist, ranked by composite score
 */
export async function getScreenerResults(presetName: string = "balanced"): Promise<ScreenerResult[]> {
  // Get all watchlist instruments
  const watchlistItems = await db
    .select({
      id: instruments.id,
      symbol: instruments.symbol,
      name: instruments.name,
    })
    .from(watchlist)
    .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id));

  const instrumentIds = watchlistItems.map((item) => item.id);

  // Batch load latest 30 prices per instrument for sparklines
  const allPrices = await db
    .select({
      instrumentId: pricesDaily.instrumentId,
      close: pricesDaily.close,
      date: pricesDaily.date,
    })
    .from(pricesDaily)
    .where(inArray(pricesDaily.instrumentId, instrumentIds))
    .orderBy(desc(pricesDaily.date));

  // Group by instrument and keep latest 30 prices
  const pricesByInstrument: Record<number, typeof allPrices> = {};
  for (const price of allPrices) {
    if (!pricesByInstrument[price.instrumentId]) {
      pricesByInstrument[price.instrumentId] = [];
    }
    if (pricesByInstrument[price.instrumentId].length < 30) {
      pricesByInstrument[price.instrumentId].push(price);
    }
  }

  const results: ScreenerResult[] = [];

  for (const item of watchlistItems) {
    // Get latest factor scores
    const scores = await db
      .select()
      .from(factorScores)
      .where(eq(factorScores.instrumentId, item.id))
      .orderBy(desc(factorScores.runAt))
      .limit(5);

    // Organize scores by factor (latest only)
    const scoresByFactor: Record<string, number> = {};
    const seenFactors = new Set<string>();

    for (const score of scores) {
      if (!seenFactors.has(score.factor)) {
        scoresByFactor[score.factor] = score.percentile;
        seenFactors.add(score.factor);
      }
    }

    // Compute composite (simple average for now)
    const factorValues = [
      scoresByFactor["valuation"] ?? 50,
      scoresByFactor["growth"] ?? 50,
      scoresByFactor["quality"] ?? 50,
      scoresByFactor["momentum"] ?? 50,
    ];
    const compositeScore =
      factorValues.reduce((a, b) => a + b, 0) / factorValues.length;

    // Build sparkline if we have multiple prices
    const prices = pricesByInstrument[item.id] || [];
    const sparkline = prices.length > 1 ? prices.map((p) => p.close).reverse() : undefined;

    results.push({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      compositeScore,
      preset: presetName,
      valuation: scoresByFactor["valuation"] ?? 50,
      growth: scoresByFactor["growth"] ?? 50,
      quality: scoresByFactor["quality"] ?? 50,
      momentum: scoresByFactor["momentum"] ?? 50,
      confidence: scores.length > 0 ? "high" : "low",
      sparkline,
    });
  }

  // Sort by composite score descending
  return results.sort((a, b) => b.compositeScore - a.compositeScore);
}
