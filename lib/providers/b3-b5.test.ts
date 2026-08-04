/**
 * Tests for B3 (fundamentals), B4 (crypto), B5 (macro).
 * Offline with faked clients; live endpoints verified separately.
 */
import { describe, expect, it, vi } from "vitest";
import { CoinGeckoCryptoProvider, type CoinGeckoClient } from "@/lib/providers/coingecko";
import { FredMacroProvider, type FredClient } from "@/lib/providers/fred";
import { YahooFundamentalsProvider, type YahooSummaryClient } from "@/lib/providers/yahoo-fundamentals";

describe("YahooFundamentalsProvider", () => {
  const fakeClient = (overrides?: Partial<YahooSummaryClient>): YahooSummaryClient => ({
    quoteSummary: vi.fn().mockResolvedValue({
      financialData: { trailingPE: 28.5, priceToSalesTrailing12Months: 5.2, marketCap: 3e12, operatingCashflow: 1.5e11 },
      defaultKeyStatistics: { priceToBook: 45, enterpriseToEbitda: 22 },
    }),
    ...overrides,
  });

  it("maps quoteSummary metrics", async () => {
    const provider = new YahooFundamentalsProvider(fakeClient());
    const metrics = await provider.getMetrics("AAPL", ["pe_ttm", "pb_ratio", "fcf_yield"]);
    expect(metrics).toHaveLength(3);
    expect(metrics[0].metric).toBe("pe_ttm");
    expect(metrics[0].value).toBe(28.5);
    expect(metrics[2].value).toBeCloseTo(0.05);
  });

  it("returns empty array for empty metric list", async () => {
    const provider = new YahooFundamentalsProvider(fakeClient());
    expect(await provider.getMetrics("AAPL", [])).toEqual([]);
  });

  it("sets asOf only when value is non-null", async () => {
    const provider = new YahooFundamentalsProvider(
      fakeClient({
        quoteSummary: vi.fn().mockResolvedValue({ financialData: {}, defaultKeyStatistics: {} }),
      }),
    );
    const metrics = await provider.getMetrics("AAPL", ["pe_ttm"]);
    expect(metrics[0].value).toBeNull();
    expect(metrics[0].asOf).toBeNull(); // asOf is null when value is null
  });
});

describe("CoinGeckoCryptoProvider", () => {
  const fakeClient = (overrides?: Partial<CoinGeckoClient>): CoinGeckoClient => ({
    simplePrice: vi.fn().mockResolvedValue({
      btc: { usd: { usd: 42_000, usd_market_cap: 8.2e11, last_updated_at: 1722700000 } },
      eth: { usd: { usd: 2_300, usd_market_cap: 2.7e11, last_updated_at: 1722700000 } },
    }),
    marketChart: vi.fn().mockResolvedValue({
      prices: [[1722614400000, 42000], [1722700800000, 42_500], [1722787200000, 41_800]],
    }),
    ...overrides,
  });

  it("maps CoinGecko prices to Quote format", async () => {
    const provider = new CoinGeckoCryptoProvider(fakeClient());
    const quotes = await provider.getQuotes(["BTC", "ETH"]);
    expect(quotes).toHaveLength(2);
    expect(quotes[0].symbol).toBe("BTC");
    expect(quotes[0].price).toBe(42_000);
    expect(quotes[0].currency).toBe("USD");
  });

  it("filters to date range on history", async () => {
    const provider = new CoinGeckoCryptoProvider(fakeClient());
    // Note: fakeClient has prices on 08-04, 08-05, 08-06; filter to 08-04 and 08-05
    const bars = await provider.getDailyHistory("bitcoin", { from: "2024-08-04", to: "2024-08-05" });
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0].date).toMatch(/2024-08-0[45]/);
  });
});

describe("FredMacroProvider", () => {
  const fakeClient = (overrides?: Partial<FredClient>): FredClient => ({
    series: vi.fn().mockResolvedValue({ id: "T10Y2Y" }),
    data: vi.fn().mockResolvedValue({
      observations: [
        { date: "2026-07-01", value: "1.52" },
        { date: "2026-08-01", value: "1.48" },
      ],
    }),
    ...overrides,
  });

  it("parses FRED observations", async () => {
    const provider = new FredMacroProvider("test-key", fakeClient());
    const obs = await provider.getObservations(["T10Y2Y"], { from: "2026-07-01" });
    expect(obs).toHaveLength(2);
    expect(obs[0].value).toBe(1.52);
  });

  it("requires FRED_API_KEY on init", () => {
    expect(() => new FredMacroProvider(undefined, fakeClient())).toThrow(/FRED_API_KEY/);
  });
});
