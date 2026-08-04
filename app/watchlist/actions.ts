"use server";

/**
 * Watchlist server actions: add/remove instruments, fetch live quotes.
 * TODO: Add auth checks before production.
 */

import { db } from "@/db/client";
import { instruments, watchlist, pricesDaily, factorScores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

  const results: WatchlistQuote[] = [];

  for (const item of watchlistItems) {
    // Get latest price
    const latestPrice = await db
      .select({
        close: pricesDaily.close,
        asOf: pricesDaily.date,
      })
      .from(pricesDaily)
      .where(eq(pricesDaily.instrumentId, item.id))
      .orderBy(desc(pricesDaily.date))
      .limit(1);

    // Get latest factor scores
    const scores = await db
      .select()
      .from(factorScores)
      .where(eq(factorScores.instrumentId, item.id))
      .orderBy(desc(factorScores.runAt))
      .limit(5);

    const scoresByFactor: Record<string, number> = {};
    for (const score of scores) {
      if (!scoresByFactor[score.factor]) {
        scoresByFactor[score.factor] = score.percentile;
      }
    }

    if (latestPrice.length > 0) {
      // Get previous price for change calculation
      const prevPrice = await db
        .select({ close: pricesDaily.close })
        .from(pricesDaily)
        .where(eq(pricesDaily.instrumentId, item.id))
        .orderBy(desc(pricesDaily.date))
        .limit(2);

      const current = latestPrice[0].close;
      const previous = prevPrice.length > 1 ? prevPrice[1].close : current;
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;

      results.push({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        price: current,
        change,
        changePercent,
        asOf: latestPrice[0].asOf,
        compositeScore: scoresByFactor["composite"],
        valuation: scoresByFactor["valuation"],
        growth: scoresByFactor["growth"],
        quality: scoresByFactor["quality"],
        momentum: scoresByFactor["momentum"],
      });
    } else {
      // No price data yet - show placeholder
      results.push({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        price: 0,
        change: 0,
        changePercent: 0,
        asOf: new Date().toISOString().split('T')[0],
        compositeScore: scoresByFactor["composite"],
        valuation: scoresByFactor["valuation"],
        growth: scoresByFactor["growth"],
        quality: scoresByFactor["quality"],
        momentum: scoresByFactor["momentum"],
      });
    }
  }

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
