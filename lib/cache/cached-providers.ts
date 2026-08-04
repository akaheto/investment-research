/**
 * Cached provider wrappers — wrap providers with getCachedOrFetch to reduce API calls.
 * Used by registry when caching is enabled (default for production).
 */

import type { EquityProvider, FundamentalsProvider, HistoryRange, PriceBar, Quote } from "@/lib/providers/types";
import { getCachedOrFetch } from "./provider-cache";

/**
 * Wraps an EquityProvider with caching for quotes (15min TTL).
 * Skips cache for individual symbols with null quote (known miss).
 */
export function withCachedQuotes(provider: EquityProvider): EquityProvider {
  return {
    name: provider.name,
    async getQuotes(symbols: string[]) {
      if (symbols.length === 0) return [];

      // Fetch each symbol independently so we cache per-symbol
      const quotes = await Promise.all(
        symbols.map((sym) =>
          getCachedOrFetch<Quote | null>(
            `quote:${provider.name}:${sym}`,
            "quotes",
            async () => {
              const result = await provider.getQuotes([sym]);
              return result[0] || null;
            },
          ),
        ),
      );

      return quotes.filter((q): q is Quote => q !== null);
    },

    async getDailyHistory(symbol: string, range: HistoryRange) {
      const cacheKey = `history:${provider.name}:${symbol}:${range.from}:${range.to || "today"}`;
      return getCachedOrFetch<PriceBar[]>(cacheKey, "fundamentals", () =>
        provider.getDailyHistory(symbol, range),
      );
    },
  };
}

/**
 * Wraps a FundamentalsProvider with caching for metrics (24h TTL).
 */
export function withCachedFundamentals(provider: FundamentalsProvider): FundamentalsProvider {
  return {
    async getCompanyProfile(symbol: string) {
      return getCachedOrFetch(
        `profile:${provider.constructor.name}:${symbol}`,
        "fundamentals",
        () => provider.getCompanyProfile(symbol),
      );
    },

    async getMetrics(symbol: string) {
      return getCachedOrFetch(
        `metrics:${provider.constructor.name}:${symbol}`,
        "fundamentals",
        () => provider.getMetrics(symbol),
      );
    },

    async getEarningsEstimates(symbol: string) {
      return getCachedOrFetch(
        `earnings:${provider.constructor.name}:${symbol}`,
        "fundamentals",
        () => provider.getEarningsEstimates(symbol),
      );
    },

    async getSentiment(symbol: string) {
      return getCachedOrFetch(
        `sentiment:${provider.constructor.name}:${symbol}`,
        "fundamentals",
        () => provider.getSentiment(symbol),
      );
    },
  };
}
