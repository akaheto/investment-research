"use server";

/**
 * Watchlist server actions: add/remove instruments, fetch live quotes.
 * TODO: Add auth checks before production.
 */

import { db } from "@/db/client";
import { instruments, watchlist, pricesDaily, factorScores } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export interface WatchlistQuote {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  asOf: string;
  compositeScore?: number;
  valuation?: number;
  growth?: number;
  quality?: number;
  momentum?: number;
}

/**
 * Get watchlist with latest quotes.
 * Returns items with prices if available; items without prices shown with placeholder values.
 */
export async function getWatchlistWithQuotes(): Promise<WatchlistQuote[]> {
  const watchlistItems = await db
    .select({
      id: instruments.id,
      symbol: instruments.symbol,
      name: instruments.name,
      instrumentId: watchlist.instrumentId,
    })
    .from(watchlist)
    .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id));

  if (watchlistItems.length === 0) {
    return [];
  }

  const instrumentIds = watchlistItems.map((w) => w.id);

  // Batch load the latest prices for all instruments
  const allPrices = await db
    .select({
      instrumentId: pricesDaily.instrumentId,
      close: pricesDaily.close,
      date: pricesDaily.date,
    })
    .from(pricesDaily)
    .where(inArray(pricesDaily.instrumentId, instrumentIds))
    .orderBy(desc(pricesDaily.date));

  // Group by instrument and get latest 2 prices per instrument
  const pricesByInstrument: Record<number, typeof allPrices> = {};
  for (const price of allPrices) {
    if (!pricesByInstrument[price.instrumentId]) {
      pricesByInstrument[price.instrumentId] = [];
    }
    if (pricesByInstrument[price.instrumentId].length < 2) {
      pricesByInstrument[price.instrumentId].push(price);
    }
  }

  // Batch load all factor scores
  const allScores = await db
    .select()
    .from(factorScores)
    .where(inArray(factorScores.instrumentId, instrumentIds))
    .orderBy(desc(factorScores.runAt));

  // Group by instrument and get latest scores
  const scoresByInstrument: Record<number, Record<string, number>> = {};
  for (const score of allScores) {
    if (!scoresByInstrument[score.instrumentId]) {
      scoresByInstrument[score.instrumentId] = {};
    }
    if (!scoresByInstrument[score.instrumentId][score.factor]) {
      scoresByInstrument[score.instrumentId][score.factor] = score.percentile;
    }
  }

  // Build results
  const results: WatchlistQuote[] = watchlistItems.map((item) => {
    const prices = pricesByInstrument[item.id] || [];
    const scores = scoresByInstrument[item.id] || {};

    if (prices.length > 0) {
      const current = prices[0].close;
      const previous = prices.length > 1 ? prices[1].close : current;
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;

      return {
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        price: current,
        change,
        changePercent,
        asOf: prices[0].date,
        compositeScore: scores["composite"],
        valuation: scores["valuation"],
        growth: scores["growth"],
        quality: scores["quality"],
        momentum: scores["momentum"],
      };
    } else {
      return {
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        price: 0,
        change: 0,
        changePercent: 0,
        asOf: new Date().toISOString().split('T')[0],
        compositeScore: scores["composite"],
        valuation: scores["valuation"],
        growth: scores["growth"],
        quality: scores["quality"],
        momentum: scores["momentum"],
      };
    }
  });

  return results;
}

/**
 * Add instrument to watchlist.
 */
export async function addToWatchlist(symbol: string) {
  try {
    // Find or create instrument
    const existing = await db.select().from(instruments).where(eq(instruments.symbol, symbol));

    let instrumentId: number;
    if (existing.length > 0) {
      instrumentId = existing[0].id;
    } else {
      const result = await db
        .insert(instruments)
        .values({
          symbol,
          name: symbol,
          assetClass: "stock",
          currency: "USD",
          active: true,
        })
        .returning();
      instrumentId = result[0].id;
    }

    // Add to watchlist
    await db.insert(watchlist).values({
      instrumentId,
      addedAt: new Date().toISOString(),
    });

    return { ok: true, instrumentId };
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Remove instrument from watchlist.
 */
export async function removeFromWatchlist(instrumentId: number) {
  try {
    await db.delete(watchlist).where(eq(watchlist.instrumentId, instrumentId));
    return { ok: true };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return { ok: false, error: String(error) };
  }
}
