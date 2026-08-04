"use server";

import { db } from "@/db/client";
import { instruments, pricesDaily, macroSeries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  asOf: string;
}

export interface YieldPoint {
  tenor: string;
  yield: number;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Get market indices (SPY, QQQ, IWM)
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  try {
    const symbols = ["SPY", "QQQ", "IWM"];
    const results: MarketIndex[] = [];

    for (const symbol of symbols) {
      const instrument = await db.select().from(instruments).where(eq(instruments.symbol, symbol));
      if (instrument.length === 0) continue;

      const prices = await db
        .select({ close: pricesDaily.close, date: pricesDaily.date })
        .from(pricesDaily)
        .where(eq(pricesDaily.instrumentId, instrument[0].id))
        .orderBy(desc(pricesDaily.date))
        .limit(2);

      if (prices.length > 0) {
        const current = prices[0].close;
        const previous = prices.length > 1 ? prices[1].close : current;
        const change = current - previous;
        const changePercent = previous > 0 ? (change / previous) * 100 : 0;

        results.push({
          symbol,
          name: { SPY: "S&P 500", QQQ: "Nasdaq", IWM: "Russell 2000" }[symbol] || symbol,
          price: current,
          change,
          changePercent,
          asOf: prices[0].date,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Failed to get market indices:", error);
    return [];
  }
}

/**
 * Get yield curve from FRED macro series
 */
export async function getYieldCurve(): Promise<YieldPoint[]> {
  try {
    const seriesMap: Record<string, string> = {
      "2Y": "T2Y",
      "5Y": "T5Y",
      "10Y": "T10Y",
      "30Y": "T30Y",
    };

    const results: YieldPoint[] = [];

    for (const [tenor, fredId] of Object.entries(seriesMap)) {
      const latest = await db
        .select({ value: macroSeries.value })
        .from(macroSeries)
        .where(eq(macroSeries.seriesId, fredId))
        .orderBy(desc(macroSeries.date))
        .limit(1);

      if (latest.length > 0) {
        results.push({
          tenor,
          yield: latest[0].value,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Failed to get yield curve:", error);
    return [];
  }
}

/**
 * Get top crypto by market cap from instruments table
 */
export async function getTopCrypto(): Promise<CryptoQuote[]> {
  try {
    const symbols = ["BTC", "ETH", "USDT"];
    const results: CryptoQuote[] = [];

    for (const symbol of symbols) {
      const instrument = await db.select().from(instruments).where(eq(instruments.symbol, symbol));
      if (instrument.length === 0) continue;

      const prices = await db
        .select({ close: pricesDaily.close })
        .from(pricesDaily)
        .where(eq(pricesDaily.instrumentId, instrument[0].id))
        .orderBy(desc(pricesDaily.date))
        .limit(2);

      if (prices.length > 0) {
        const current = prices[0].close;
        const previous = prices.length > 1 ? prices[1].close : current;
        const change = current - previous;
        const changePercent = previous > 0 ? (change / previous) * 100 : 0;

        const nameMap: Record<string, string> = {
          BTC: "Bitcoin",
          ETH: "Ethereum",
          USDT: "Tether",
        };

        results.push({
          symbol,
          name: nameMap[symbol] || symbol,
          price: current,
          change,
          changePercent,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Failed to get top crypto:", error);
    return [];
  }
}

/**
 * Get macro regime metrics
 */
export async function getMacroRegime(): Promise<{
  yieldCurveSlope: number;
  creditSpread: number;
  realYield10y: number;
}> {
  try {
    // Fetch 2Y and 10Y yields for curve slope
    const t2y = await db
      .select({ value: macroSeries.value })
      .from(macroSeries)
      .where(eq(macroSeries.seriesId, "T2Y"))
      .orderBy(desc(macroSeries.date))
      .limit(1);

    const t10y = await db
      .select({ value: macroSeries.value })
      .from(macroSeries)
      .where(eq(macroSeries.seriesId, "T10Y"))
      .orderBy(desc(macroSeries.date))
      .limit(1);

    const yield2y = t2y.length > 0 ? t2y[0].value : 4.0;
    const yield10y = t10y.length > 0 ? t10y[0].value : 4.2;

    // Calculate slope in basis points
    const yieldCurveSlope = Math.round((yield10y - yield2y) * 100);

    // Default credit spreads and real yields (normally from FRED: BAMLH0A0HYM, DFEDTARD)
    const creditSpread = 350;
    const realYield10y = Math.round((yield10y - 2.5) * 100); // 2.5% inflation assumption

    return { yieldCurveSlope, creditSpread, realYield10y };
  } catch (error) {
    console.error("❌ Failed to get macro regime:", error);
    return { yieldCurveSlope: 0, creditSpread: 0, realYield10y: 0 };
  }
}
