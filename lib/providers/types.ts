/**
 * Provider contracts — the free→paid upgrade seam (TECHNICAL_SPEC § Architecture).
 * Every data source implements one of these interfaces; the app only ever
 * imports the interface + registry, never a concrete provider.
 */

export interface Quote {
  symbol: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  /** RATIO, not percent points: +1.23% is 0.0123 (matches lib/format.formatPercent). */
  changePercent: number | null;
  currency: string;
  marketCap: number | null;
  /** ISO timestamp of the quote (provider market time, not fetch time). */
  asOf: string | null;
}

export interface PriceBar {
  /** YYYY-MM-DD */
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

export interface HistoryRange {
  /** YYYY-MM-DD inclusive */
  from: string;
  /** YYYY-MM-DD; defaults to today */
  to?: string;
}

export interface EquityProvider {
  readonly name: string;
  /** Batch quote lookup. Empty input → empty output, no network call. */
  getQuotes(symbols: string[]): Promise<Quote[]>;
  /** Daily OHLCV bars, oldest first. */
  getDailyHistory(symbol: string, range: HistoryRange): Promise<PriceBar[]>;
}

/** Uniform error wrapper so callers can handle any provider identically. */
export class ProviderError extends Error {
  readonly provider: string;
  readonly symbol?: string;

  constructor(message: string, opts: { provider: string; symbol?: string; cause?: unknown }) {
    super(message, { cause: opts.cause });
    this.name = "ProviderError";
    this.provider = opts.provider;
    this.symbol = opts.symbol;
  }
}
