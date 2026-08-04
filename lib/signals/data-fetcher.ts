/**
 * Data fetcher — pulls real metrics from providers and populates RawMetrics.
 * Wires Finnhub, Alpha Vantage, and cached fundamentals into scoring pipeline.
 */

import type { RawMetrics } from "./types";
import { getFundamentalsProvider, alphaVantageProvider } from "@/lib/providers/index";
import { logApiCall } from "@/lib/audit/tracker";

export async function fetchMetricsForSymbol(symbol: string, sector?: string): Promise<RawMetrics> {
  const metrics: RawMetrics = { sectorId: sector };

  try {
    // Fetch Finnhub metrics (valuation, quality)
    const finnhub = getFundamentalsProvider();
    const startTime = Date.now();

    const finnhubMetrics = (await finnhub.getMetrics(symbol)) as Record<string, unknown>;
    const duration = Date.now() - startTime;

    if (finnhubMetrics) {
      logApiCall({
        provider: "finnhub",
        endpoint: `/stock/metric?symbol=${symbol}`,
        statusCode: 200,
        durationMs: duration,
        recordsReturned: 1,
      });

      metrics.peRatio = (finnhubMetrics?.peRatio as number | undefined) || undefined;
      metrics.priceToBook = (finnhubMetrics?.pbRatio as number | undefined) || undefined;
      metrics.roe = (finnhubMetrics?.roe as number | undefined) || undefined;
      metrics.debtToEquity = undefined; // TODO: Add to Finnhub provider
    }

    // Fetch Alpha Vantage technical indicators (momentum)
    const rsiData = await alphaVantageProvider.getRSI(symbol);
    if (rsiData) {
      // Convert RSI (0-100) to a momentum proxy: overbought = low momentum (high valuation), oversold = high momentum
      metrics.return6m = (rsiData.rsi - 50) / 50; // Normalized to -1..1
    }

    return metrics;
  } catch (err) {
    console.error(`Failed to fetch metrics for ${symbol}:`, err);
    return metrics;
  }
}

/**
 * Fetch metrics for a universe of symbols (for percentile ranking).
 * Used to calculate comparative factor scores.
 */
export async function fetchMetricsForUniverse(symbols: string[]): Promise<RawMetrics[]> {
  const results: RawMetrics[] = [];

  for (const symbol of symbols) {
    try {
      const metrics = await fetchMetricsForSymbol(symbol);
      results.push(metrics);
    } catch (err) {
      console.warn(`Skipped ${symbol} in universe fetch:`, err);
      results.push({}); // Empty metrics for failed fetches
    }
  }

  return results;
}
