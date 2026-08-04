import { afterEach, describe, expect, it, vi } from "vitest";
import { getEquityProvider } from "@/lib/providers";
import { ProviderError } from "@/lib/providers/types";
import { type YahooClient, YahooEquityProvider } from "@/lib/providers/yahoo";

const fakeClient = (overrides: Partial<YahooClient> = {}): YahooClient => ({
  quote: vi.fn().mockResolvedValue([
    {
      symbol: "VTI",
      regularMarketPrice: 312.4,
      regularMarketPreviousClose: 310.1,
      regularMarketChange: 2.3,
      regularMarketChangePercent: 0.74, // percent points from Yahoo
      currency: "USD",
      marketCap: 1.5e12,
      regularMarketTime: new Date("2026-08-03T20:00:00Z"),
    },
  ]),
  chart: vi.fn().mockResolvedValue({
    quotes: [
      { date: new Date("2026-07-31T13:30:00Z"), open: 309, high: 313, low: 308, close: 310.1, volume: 3.1e6 },
      // null-close padding row (holiday) — must be dropped
      { date: new Date("2026-08-01T13:30:00Z"), open: null, high: null, low: null, close: null, volume: null },
      { date: new Date("2026-08-03T13:30:00Z"), open: 310, high: 314, low: 309.5, close: 312.4, volume: 2.8e6 },
    ],
  }),
  ...overrides,
});

describe("YahooEquityProvider.getQuotes", () => {
  it("maps a quote and converts percent points to a ratio", async () => {
    const provider = new YahooEquityProvider(fakeClient());
    const [q] = await provider.getQuotes(["VTI"]);
    expect(q.symbol).toBe("VTI");
    expect(q.price).toBe(312.4);
    expect(q.changePercent).toBeCloseTo(0.0074); // 0.74% → ratio
    expect(q.asOf).toBe("2026-08-03T20:00:00.000Z");
  });

  // Unhappy path: no symbols → no network call at all
  it("returns [] for empty input without calling the client", async () => {
    const client = fakeClient();
    const provider = new YahooEquityProvider(client);
    expect(await provider.getQuotes([])).toEqual([]);
    expect(client.quote).not.toHaveBeenCalled();
  });

  // Unhappy path: rows without a price (delisted/bad symbol) are dropped, not NaN
  it("drops rows missing a market price", async () => {
    const provider = new YahooEquityProvider(
      fakeClient({ quote: vi.fn().mockResolvedValue([{ symbol: "GONE" }]) }),
    );
    expect(await provider.getQuotes(["GONE"])).toEqual([]);
  });

  // Unhappy path: transport failure wraps into ProviderError with context
  it("wraps client failures in ProviderError", async () => {
    const provider = new YahooEquityProvider(
      fakeClient({ quote: vi.fn().mockRejectedValue(new Error("boom")) }),
    );
    const err = await provider.getQuotes(["VTI"]).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect((err as ProviderError).provider).toBe("yahoo");
  });
});

describe("YahooEquityProvider.getDailyHistory", () => {
  it("maps bars to YYYY-MM-DD and drops null-close padding rows", async () => {
    const provider = new YahooEquityProvider(fakeClient());
    const bars = await provider.getDailyHistory("VTI", { from: "2026-07-31" });
    expect(bars).toHaveLength(2);
    expect(bars[0]).toEqual({ date: "2026-07-31", open: 309, high: 313, low: 308, close: 310.1, volume: 3.1e6 });
  });

  it("wraps history failures with the symbol attached", async () => {
    const provider = new YahooEquityProvider(
      fakeClient({ chart: vi.fn().mockRejectedValue(new Error("404")) }),
    );
    const err = await provider.getDailyHistory("NOPE", { from: "2026-01-01" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect((err as ProviderError).symbol).toBe("NOPE");
  });
});

describe("provider registry", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to yahoo", () => {
    expect(getEquityProvider().name).toBe("yahoo");
  });

  // Unhappy path: a typo'd env var fails loudly, not silently
  it("rejects an unknown EQUITY_PROVIDER", () => {
    vi.stubEnv("EQUITY_PROVIDER", "bloomberg_terminal");
    expect(() => getEquityProvider()).toThrow(/Unknown EQUITY_PROVIDER/);
  });
});
