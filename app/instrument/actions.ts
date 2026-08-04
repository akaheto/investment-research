"use server";

import { db } from "@/db/client";
import { instruments, pricesDaily, fundamentalsSnapshots, factorScores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface InstrumentDetail {
  symbol: string;
  name: string;
  assetClass: string;
  priceHistory: Array<{ date: string; close: number }>;
  fundamentals: Array<{ label: string; value: string | number; benchmark: string }>;
  compositeScore?: number;
  factors?: Record<string, number>;
}

/**
 * Get instrument detail: price history, latest fundamentals, and scores
 */
export async function getInstrumentDetail(symbol: string): Promise<InstrumentDetail | null> {
  // Find instrument
  const instrumentData = await db
    .select()
    .from(instruments)
    .where(eq(instruments.symbol, symbol.toUpperCase()));

  if (instrumentData.length === 0) {
    return null;
  }

  const instrument = instrumentData[0];

  // Get price history (last 30 days)
  const prices = await db
    .select({ date: pricesDaily.date, close: pricesDaily.close })
    .from(pricesDaily)
    .where(eq(pricesDaily.instrumentId, instrument.id))
    .orderBy(desc(pricesDaily.date))
    .limit(30);

  // Get latest fundamentals
  const fundamentals = await db
    .select()
    .from(fundamentalsSnapshots)
    .where(eq(fundamentalsSnapshots.instrumentId, instrument.id))
    .orderBy(desc(fundamentalsSnapshots.asOf))
    .limit(50);

  // Get latest factor scores
  const scores = await db
    .select()
    .from(factorScores)
    .where(eq(factorScores.instrumentId, instrument.id))
    .orderBy(desc(factorScores.runAt))
    .limit(5);

  // Organize fundamentals by metric (latest only)
  const fundsByMetric: Record<string, number> = {};
  const seenMetrics = new Set<string>();
  for (const f of fundamentals) {
    if (!seenMetrics.has(f.metric)) {
      fundsByMetric[f.metric] = f.value;
      seenMetrics.add(f.metric);
    }
  }

  // Map metric names to display labels
  const metricLabels: Record<string, { label: string; benchmark: string }> = {
    pe_ttm: { label: "P/E (TTM)", benchmark: "15-25" },
    pb: { label: "Price / Book", benchmark: "1.5-3.0" },
    debt_equity: { label: "Debt / Equity", benchmark: "< 1.0" },
    roe: { label: "ROE", benchmark: "> 15%" },
    fcf_yield: { label: "FCF Yield", benchmark: "> 3%" },
    gross_margin: { label: "Gross Margin", benchmark: "> 30%" },
    net_margin: { label: "Net Margin", benchmark: "> 5%" },
    dividend_yield: { label: "Dividend Yield", benchmark: "1-4%" },
  };

  const fundsList = Object.entries(fundsByMetric)
    .slice(0, 4)
    .map(([metric, value]) => ({
      label: metricLabels[metric]?.label || metric,
      value: metric.includes("margin") || metric.includes("yield") ? `${(value * 100).toFixed(1)}%` : value.toFixed(2),
      benchmark: metricLabels[metric]?.benchmark || "–",
    }));

  // Organize factor scores (latest only)
  const scoresByFactor: Record<string, number> = {};
  const seenFactors = new Set<string>();
  for (const score of scores) {
    if (!seenFactors.has(score.factor)) {
      scoresByFactor[score.factor] = score.percentile;
      seenFactors.add(score.factor);
    }
  }

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    assetClass: instrument.assetClass,
    priceHistory: prices.reverse().map((p) => ({ date: p.date, close: p.close })),
    fundamentals: fundsList.length > 0 ? fundsList : [],
    compositeScore: scoresByFactor["composite"],
    factors: {
      valuation: scoresByFactor["valuation"],
      growth: scoresByFactor["growth"],
      quality: scoresByFactor["quality"],
      momentum: scoresByFactor["momentum"],
    },
  };
}
