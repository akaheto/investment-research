/**
 * Fundamentals via yahoo-finance2 quoteSummary endpoints.
 * Extracts P/E, debt/equity, margins, and growth rates where available.
 */
import YahooFinance from "yahoo-finance2";
import { type FundamentalMetric, FundamentalsError, type FundamentalsProvider } from "./fundamentals";

export type YahooSummaryClient = {
  quoteSummary(
    symbol: string,
    opts: { modules: string[] },
  ): Promise<Record<string, Record<string, unknown>>>;
};

export class YahooFundamentalsProvider implements FundamentalsProvider {
  readonly name = "yahoo";
  private client: YahooSummaryClient;

  constructor(client?: YahooSummaryClient) {
    this.client = client ?? (new YahooFinance() as unknown as YahooSummaryClient);
  }

  async getMetrics(symbol: string, metrics: string[]): Promise<FundamentalMetric[]> {
    if (metrics.length === 0) return [];
    let summary: Record<string, Record<string, unknown>>;
    try {
      summary = await this.client.quoteSummary(symbol, {
        modules: ["financialData", "defaultKeyStatistics", "incomeStatementHistory"],
      });
    } catch (cause) {
      throw new FundamentalsError(`quoteSummary failed for ${symbol}`, { provider: this.name, symbol, cause });
    }

    const result: FundamentalMetric[] = [];
    const financial = summary.financialData ?? {};
    const keyStats = summary.defaultKeyStatistics ?? {};
    const now = new Date().toISOString();

    const mapping: Record<string, () => number | null> = {
      pe_ttm: () => financial.trailingPE as number | null,
      pe_forward: () => financial.forwardPE as number | null,
      pb_ratio: () => keyStats.priceToBook as number | null,
      ps_ratio: () => financial.priceToSalesTrailing12Months as number | null,
      ev_ebitda: () => keyStats.enterpriseToEbitda as number | null,
      fcf_yield: () => financial.operatingCashflow && financial.marketCap
        ? (financial.operatingCashflow as number) / (financial.marketCap as number)
        : null,
      debt_equity: () => financial.debtToEquity as number | null,
      gross_margin: () => (financial.grossMargins as unknown as number[] | undefined)?.[0] ?? null,
      operating_margin: () => (financial.operatingMargins as unknown as number[] | undefined)?.[0] ?? null,
    };

    for (const metric of metrics) {
      const fn = mapping[metric];
      const value = fn?.() ?? null;
      result.push({ metric, value, asOf: value != null ? now : null });
    }
    return result;
  }
}
