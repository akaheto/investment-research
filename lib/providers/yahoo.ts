/**
 * Equities/ETF provider backed by yahoo-finance2 v4 (free, unofficial).
 * Known risk (TECHNICAL_SPEC § Limitations): endpoints can change without
 * notice — which is exactly why everything routes through EquityProvider.
 */
import YahooFinance from "yahoo-finance2";
import { type EquityProvider, type HistoryRange, type PriceBar, ProviderError, type Quote, type SymbolMatch } from "./types";

/** The slice of the yahoo-finance2 client we use — injectable for tests. */
export type YahooClient = {
  quote(symbols: string[]): Promise<YahooQuoteRow[]>;
  chart(symbol: string, opts: { period1: string; period2?: string; interval: "1d" }): Promise<YahooChartResult>;
  search(query: string): Promise<YahooSearchResult>;
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

export interface YahooSearchQuoteRow {
  symbol?: string;
  shortname?: string;
  longname?: string;
  /** 'EQUITY' | 'ETF' | 'INDEX' | ... — only these three are treated as watchlist-able. */
  quoteType?: string;
  score?: number;
  isYahooFinance?: boolean;
}
export interface YahooSearchResult {
  quotes: YahooSearchQuoteRow[];
}

/** Search result quote types we accept for the watchlist; anything else (options, futures, currencies, crunchbase entries) is ignored. */
const SEARCH_ASSET_CLASS_BY_QUOTE_TYPE: Record<string, string> = {
  EQUITY: "stock",
  ETF: "etf",
  INDEX: "index",
};

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

  /**
   * Resolve free-text (a ticker or a company name) to a real symbol via
   * Yahoo's own search — it handles both cases the same way, so callers
   * don't need to guess which one they were given.
   */
  async searchSymbol(query: string): Promise<SymbolMatch | null> {
    const trimmed = query.trim();
    if (!trimmed) return null;

    let result: YahooSearchResult;
    try {
      result = await this.client.search(trimmed);
    } catch (cause) {
      throw new ProviderError(`search request failed for "${trimmed}"`, { provider: this.name, cause });
    }

    const candidates = (result.quotes ?? []).filter(
      (q): q is YahooSearchQuoteRow & { symbol: string; quoteType: string } =>
        q.isYahooFinance === true && typeof q.symbol === "string" && !!q.quoteType && q.quoteType in SEARCH_ASSET_CLASS_BY_QUOTE_TYPE,
    );
    if (candidates.length === 0) return null;

    // Prefer an exact ticker match over the highest search-relevance score
    // (e.g. querying "AAPL" should never lose to a more "relevant" ETF).
    const upperQuery = trimmed.toUpperCase();
    const exact = candidates.find((c) => c.symbol.toUpperCase() === upperQuery);
    const best = exact ?? candidates.reduce((a, b) => ((b.score ?? 0) > (a.score ?? 0) ? b : a));

    return {
      symbol: best.symbol,
      name: best.longname ?? best.shortname ?? best.symbol,
      assetClass: SEARCH_ASSET_CLASS_BY_QUOTE_TYPE[best.quoteType],
    };
  }
}
