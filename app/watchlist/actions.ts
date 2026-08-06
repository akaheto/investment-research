"use server";

/**
 * Watchlist server actions: add/remove instruments, fetch live quotes.
 * TODO: Add auth checks before production.
 */

import { db } from "@/db/client";
import { instruments, watchlist, pricesDaily, factorScores } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getEquityProvider } from "@/lib/providers";

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
  sparkline?: number[];
}

/**
 * Get watchlist with latest quotes.
 * Returns items with prices if available; items without prices shown with placeholder values.
 */
export async function getWatchlistWithQuotes(): Promise<WatchlistQuote[]> {
  try {
    console.log("📋 Loading watchlist with quotes...");

    const watchlistItems = await db
      .select({
        id: instruments.id,
        symbol: instruments.symbol,
        name: instruments.name,
        instrumentId: watchlist.instrumentId,
      })
      .from(watchlist)
      .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id));

    console.log(`✓ Found ${watchlistItems.length} watchlist items`);

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

    console.log(`✓ Loaded ${allPrices.length} price records`);

    // Group by instrument and get latest 30 prices per instrument (for sparkline + change calc)
    const pricesByInstrument: Record<number, typeof allPrices> = {};
    for (const price of allPrices) {
      if (!pricesByInstrument[price.instrumentId]) {
        pricesByInstrument[price.instrumentId] = [];
      }
      if (pricesByInstrument[price.instrumentId].length < 30) {
        pricesByInstrument[price.instrumentId].push(price);
      }
    }

    // Batch load all factor scores
    const allScores = await db
      .select()
      .from(factorScores)
      .where(inArray(factorScores.instrumentId, instrumentIds))
      .orderBy(desc(factorScores.runAt));

    console.log(`✓ Loaded ${allScores.length} factor score records`);

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
        // Sparkline: ascending order (oldest to newest)
        const sparkline = prices.length > 1 ? prices.map((p) => p.close).reverse() : undefined;

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
          sparkline,
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

    console.log(`✓ Watchlist loaded with ${results.length} items`);
    return results;
  } catch (error) {
    console.error("❌ Failed to load watchlist:", error);
    return [];
  }
}

/**
 * Add an instrument to the watchlist. Accepts either a real ticker (AAPL)
 * or free text (Apple, Tesla) — resolves free text to a real symbol via the
 * equity provider's search before ever touching the database, so garbage
 * input never becomes a fake "instrument".
 */
export async function addToWatchlist(rawInput: string) {
  try {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { ok: false, error: "Enter a symbol or company name." };
    }

    // Fast path: already-known symbol in our DB, no network round trip needed.
    const upperInput = trimmed.toUpperCase();
    const existingExact = await db.select().from(instruments).where(eq(instruments.symbol, upperInput));

    let match: { symbol: string; name: string; assetClass: string };
    if (existingExact.length > 0) {
      match = existingExact[0];
    } else {
      const provider = getEquityProvider();
      if (!provider.searchSymbol) {
        return { ok: false, error: `Could not verify "${trimmed}" — symbol search unavailable.` };
      }
      const resolved = await provider.searchSymbol(trimmed);
      if (!resolved) {
        return { ok: false, error: `No matching stock found for "${trimmed}".` };
      }
      match = resolved;
    }

    // Find or create the instrument for the resolved (real) symbol.
    const existing = await db.select().from(instruments).where(eq(instruments.symbol, match.symbol));

    let instrumentId: number;
    if (existing.length > 0) {
      instrumentId = existing[0].id;
    } else {
      const result = await db
        .insert(instruments)
        .values({
          symbol: match.symbol,
          name: match.name,
          assetClass: match.assetClass,
          currency: "USD",
          active: true,
        })
        .returning();
      instrumentId = result[0].id;
    }

    // Don't add the same instrument to the watchlist twice (e.g. "Tesla"
    // then later "TSLA" both resolve to the same instrument).
    const alreadyWatched = await db.select().from(watchlist).where(eq(watchlist.instrumentId, instrumentId));
    if (alreadyWatched.length > 0) {
      return { ok: true, instrumentId, symbol: match.symbol };
    }

    await db.insert(watchlist).values({
      instrumentId,
      addedAt: new Date().toISOString(),
    });

    return { ok: true, instrumentId, symbol: match.symbol };
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
