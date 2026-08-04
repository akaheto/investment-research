/**
 * Fundamentals provider — valuation, growth, quality, crypto metrics.
 * Metric naming convention: snake_case, with optional _ttm or _3y suffix.
 * Values are always numbers; missing data is recorded as null, never omitted.
 */

export interface FundamentalMetric {
  metric: string;
  value: number | null;
  /** ISO timestamp from the source; null if not available. */
  asOf: string | null;
}

export interface FundamentalsProvider {
  readonly name: string;
  /** Fetch a set of metrics for one symbol. */
  getMetrics(symbol: string, metrics: string[]): Promise<FundamentalMetric[]>;
}

export class FundamentalsError extends Error {
  readonly provider: string;
  readonly symbol?: string;

  constructor(message: string, opts: { provider: string; symbol?: string; cause?: unknown }) {
    super(message, { cause: opts.cause });
    this.name = "FundamentalsError";
    this.provider = opts.provider;
    this.symbol = opts.symbol;
  }
}

/** Known metric names the schema expects (non-exhaustive; providers can supply more). */
export const METRIC_NAMES = {
  // Valuation
  pe_ttm: "P/E (trailing 12m)",
  pe_forward: "Forward P/E",
  pb_ratio: "Price-to-Book",
  ps_ratio: "Price-to-Sales (TTM)",
  ev_ebitda: "EV / EBITDA",
  fcf_yield: "FCF yield (FCF / market cap)",

  // Growth
  revenue_growth_3y: "Revenue growth, 3y CAGR",
  revenue_growth_yoy: "Revenue growth, YoY",
  eps_growth_yoy: "EPS growth, YoY",
  fcf_growth_3y: "FCF growth, 3y CAGR",

  // Quality
  roe: "Return on Equity",
  roic: "Return on Invested Capital",
  gross_margin: "Gross Margin",
  operating_margin: "Operating Margin",
  debt_equity: "Debt / Equity",
  interest_coverage: "Interest Coverage (EBIT / interest)",

  // Crypto (non-traditional)
  market_cap_rank: "Market cap rank (lower better for diversity)",
  max_supply: "Max supply",
  circulating_supply: "Circulating supply",
} as const;
