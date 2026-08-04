/**
 * Equities/ETF provider backed by yahoo-finance2 v4 (free, unofficial).
 * Known risk (TECHNICAL_SPEC § Limitations): endpoints can change without
 * notice — which is exactly why everything routes through EquityProvider.
 */
import YahooFinance from "yahoo-finance2";
import { type EquityProvider, type HistoryRange, type PriceBar, ProviderError, type Quote } from "./types";

/** The slice of the yahoo-finance2 client we use — injectable for tests. */
export type YahooClient = {
  quote(symbols: string[]): Promise<YahooQuoteRow[]>;
  chart(symbol: string, opts: { period1: string; period2?: string; interval: "1d" }): Promise<YahooChartResult>;
};

// Minimal shapes of the yahoo-finance2 responses we consume.
export interface YahooQuoteRow {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  /** Percent POINTS (1.23 means +1.23%) — converted to a ratio in mapping. */
  regularMarketChangePercent?: number;
  currency?: string;
  marketCap?: number;
  regularMarketTime?: Date;
}
export interface YahooChartResult {
  quotes: Array<{
    date: Date;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
  }>;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export class YahooEquityProvider implements EquityProvider {
  readonly name = "yahoo";
  private client: YahooClient;

  constructor(client?: YahooClient) {
    this.client = client ?? (new YahooFinance() as unknown as YahooClient);
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return [];
    let rows: YahooQuoteRow[];
    try {
      rows = await this.client.quote(symbols);
    } catch (cause) {
      throw new ProviderError(`quote request failed for [${symbols.join(", ")}]`, { provider: this.name, cause });
    }
    return rows
      .filter((r) => typeof r.regularMarketPrice === "number")
      .map((r) => ({
        symbol: r.symbol,
        price: r.regularMarketPrice as number,
        previousClose: r.regularMarketPreviousClose ?? null,
        change: r.regularMarketChange ?? null,
        // Yahoo reports percent points; the contract wants a ratio.
        changePercent: r.regularMarketChangePercent != null ? r.regularMarketChangePercent / 100 : null,
        currency: r.currency ?? "USD",
        marketCap: r.marketCap ?? null,
        asOf: r.regularMarketTime ? r.regularMarketTime.toISOString() : null,
      }));
  }

  async getDailyHistory(symbol: string, range: HistoryRange): Promise<PriceBar[]> {
    let result: YahooChartResult;
    try {
      result = await this.client.chart(symbol, { period1: range.from, period2: range.to, interval: "1d" });
    } catch (cause) {
      throw new ProviderError(`history request failed for ${symbol}`, { provider: this.name, symbol, cause });
    }
    return (
      result.quotes
        // Yahoo pads some ranges with null-close rows (holidays, pre-listing)
        .filter((q) => q.close != null)
        .map((q) => ({
          date: isoDay(q.date),
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.close as number,
          volume: q.volume,
        }))
    );
  }
}
