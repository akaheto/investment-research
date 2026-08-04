/**
 * Live smoke test against real Yahoo endpoints — network-dependent, so it
 * only runs when explicitly requested: SMOKE=1 npm test
 * Keeps the default suite deterministic while still letting us verify the
 * real integration (QA rule: hit the actual endpoint before "done").
 */
import { describe, expect, it } from "vitest";
import { YahooEquityProvider } from "@/lib/providers/yahoo";

describe.runIf(process.env.SMOKE === "1")("yahoo live smoke", () => {
  it("fetches real quotes for AAPL + VTI", async () => {
    const provider = new YahooEquityProvider();
    const quotes = await provider.getQuotes(["AAPL", "VTI"]);
    expect(quotes).toHaveLength(2);
    for (const q of quotes) {
      expect(q.price).toBeGreaterThan(0);
      expect(q.currency).toBe("USD");
    }
  }, 30_000);

  it("fetches ~1 month of real daily history for VTI", async () => {
    const provider = new YahooEquityProvider();
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const bars = await provider.getDailyHistory("VTI", { from, to });
    expect(bars.length).toBeGreaterThan(15); // ~20 trading days in a month
    expect(bars.every((b) => b.close > 0)).toBe(true);
    expect(bars[0].date < bars[bars.length - 1].date).toBe(true); // oldest first
  }, 30_000);
});
