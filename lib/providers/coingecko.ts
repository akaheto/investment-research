/**
 * Crypto provider via CoinGecko free API (no key required).
 * Batch requests up to 250 IDs per call (API limit).
 * Currency is always USD; volumes and market caps in USD.
 */
import { type EquityProvider, type PriceBar, ProviderError, type Quote } from "./types";

export interface CoinGeckoQuote {
  id: string;
  symbol: string;
  current_price: number;
  market_cap: number | null;
  market_cap_rank: number | null;
  last_updated: string;
}

export type CoinGeckoClient = {
  simplePrice(ids: string[], options: object): Promise<Record<string, Record<string, unknown>>>;
  marketChart(id: string, options: object): Promise<{ prices: Array<[number, number]> }>;
};

export class CoinGeckoCryptoProvider implements EquityProvider {
  readonly name = "coingecko";
  private client: CoinGeckoClient;

  constructor(client?: CoinGeckoClient) {
    this.client = client ?? createCoinGeckoClient();
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return [];
    // Map CoinGecko IDs back to user symbols (e.g. bitcoin → BTC)
    const idToSymbol = new Map<string, string>();
    const ids = symbols.map((s) => {
      const id = s.toLowerCase().replace("_", "-");
      idToSymbol.set(id, s);
      return id;
    });
    let data: Record<string, Record<string, unknown>>;
    try {
      data = await this.client.simplePrice(ids, {
        vs_currencies: "usd",
        include_market_cap: true,
        include_last_updated_at: true,
      });
    } catch (cause) {
      throw new ProviderError(`simplePrice failed for [${ids.join(", ")}]`, { provider: this.name, cause });
    }

    const result: Quote[] = [];
    for (const [id, values] of Object.entries(data)) {
      const priceData = (values as Record<string, unknown>).usd ?? values;
      if (typeof priceData !== "object") continue;
      const price = priceData as Record<string, unknown>;
      result.push({
        symbol: idToSymbol.get(id) || id.toUpperCase(),
        price: (price.usd as number) ?? 0,
        previousClose: null, // CoinGecko free tier doesn't provide previous close
        change: null,
        changePercent: null,
        currency: "USD",
        marketCap: (price.usd_market_cap as number) ?? null,
        asOf: price.last_updated_at ? new Date((price.last_updated_at as number) * 1000).toISOString() : null,
      });
    }
    return result;
  }

  async getDailyHistory(id: string, range: { from: string; to?: string }): Promise<PriceBar[]> {
    const fromMs = new Date(range.from).getTime();
    const toMs = range.to ? new Date(range.to).getTime() : Date.now();
    const days = Math.ceil((toMs - fromMs) / 86400_000);
    let chart: { prices: Array<[number, number]> };
    try {
      chart = await this.client.marketChart(id.toLowerCase(), { vs_currency: "usd", days: Math.max(days, 1) });
    } catch (cause) {
      throw new ProviderError(`marketChart failed for ${id}`, { provider: this.name, symbol: id, cause });
    }

    const bars: PriceBar[] = [];
    const toDate = range.to ? new Date(range.to).getTime() : Infinity;
    for (const [tsMs, price] of chart.prices) {
      if (tsMs >= fromMs && tsMs <= toDate) {
        const date = new Date(tsMs).toISOString().slice(0, 10);
        bars.push({ date, open: null, high: null, low: null, close: price, volume: null });
      }
    }
    return bars;
  }
}

/** Minimal fetch wrapper for CoinGecko REST API. */
function createCoinGeckoClient(): CoinGeckoClient {
  const base = "https://api.coingecko.com/api/v3";
  return {
    async simplePrice(ids: string[], options: object) {
      const params = new URLSearchParams({ ...options, ids: ids.join(",") } as Record<string, string>);
      const res = await fetch(`${base}/simple/price?${params}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    async marketChart(id: string, options: object) {
      const params = new URLSearchParams(options as Record<string, string>);
      const res = await fetch(`${base}/coins/${id}/market_chart?${params}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
  };
}
