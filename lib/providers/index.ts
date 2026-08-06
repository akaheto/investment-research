/**
 * Provider registry — env-driven selection with fallback support (B7).
 * Each PROVIDER env var can be a single provider or a pipe-separated list
 * for fallback: "primary|fallback|fallback".
 * Example: EQUITY_PROVIDER="fmp|yahoo" tries FMP first, falls back to Yahoo.
 * Providers are automatically wrapped with caching (quotes 15min, fundamentals 24h).
 */
import { type EquityProvider, type FundamentalsProvider, type BrokerageProvider, ProviderError } from "./types";
import { YahooEquityProvider } from "./yahoo";
import { CoinGeckoCryptoProvider } from "./coingecko";
import { FredMacroProvider, type MacroProvider } from "./fred";
import { FinnhubProvider } from "./finnhub";
import { alphaVantageProvider } from "./alphavantage";
import { IBKRBrokerageProvider } from "./ibkr";
import { withCachedQuotes, withCachedFundamentals } from "@/lib/cache/cached-providers";

const equityProviders: Record<string, () => EquityProvider> = {
  yahoo: () => new YahooEquityProvider(),
  // future: fmp, polygon, tiingo, alpaca — added here, selected by env only
};

const brokerageProviders: Record<string, () => BrokerageProvider> = {
  ibkr: () => new IBKRBrokerageProvider(),
  // future: fidelity, charles-schwab, etc.
};

const cryptoProviders: Record<string, () => EquityProvider> = {
  coingecko: () => new CoinGeckoCryptoProvider(),
  // future: binance, bybit, kraken (with API key)
};

const macroProviders: Record<string, () => MacroProvider> = {
  fred: () => new FredMacroProvider(),
  // future: ecb, ons, statscan
};

const fundamentalsProviders: Record<string, () => FundamentalsProvider> = {
  finnhub: () => new FinnhubProvider(),
  // future: fmp, intrinio, tiingo
};

/**
 * Get provider with fallback list.
 * EQUITY_PROVIDER="fmp|yahoo" → try FMP, fall back to Yahoo if FMP unavailable.
 * Currently returns the first available; real fallback logic comes later (B6 iteration).
 */
export function getEquityProvider(): EquityProvider {
  const list = (process.env.EQUITY_PROVIDER ?? "yahoo").split("|");
  for (const key of list) {
    const factory = equityProviders[key.trim()];
    if (factory) {
      const provider = factory();
      return process.env.DISABLE_CACHE ? provider : withCachedQuotes(provider);
    }
  }
  throw new ProviderError(
    `No known EQUITY_PROVIDER in "${list.join("|")}" — known: ${Object.keys(equityProviders).join(", ")}`,
    { provider: list[0] },
  );
}

export function getCryptoProvider(): EquityProvider {
  const list = (process.env.CRYPTO_PROVIDER ?? "coingecko").split("|");
  for (const key of list) {
    const factory = cryptoProviders[key.trim()];
    if (factory) {
      const provider = factory();
      return process.env.DISABLE_CACHE ? provider : withCachedQuotes(provider);
    }
  }
  throw new ProviderError(
    `No known CRYPTO_PROVIDER in "${list.join("|")}" — known: ${Object.keys(cryptoProviders).join(", ")}`,
    { provider: list[0] },
  );
}

export function getMacroProvider(): MacroProvider {
  const list = (process.env.MACRO_PROVIDER ?? "fred").split("|");
  for (const key of list) {
    const factory = macroProviders[key.trim()];
    if (factory) return factory();
  }
  throw new ProviderError(
    `No known MACRO_PROVIDER in "${list.join("|")}" — known: ${Object.keys(macroProviders).join(", ")}`,
    { provider: list[0] },
  );
}

export function getFundamentalsProvider(): FundamentalsProvider {
  const list = (process.env.FUNDAMENTALS_PROVIDER ?? "finnhub").split("|");
  for (const key of list) {
    const factory = fundamentalsProviders[key.trim()];
    if (factory) {
      const provider = factory();
      return process.env.DISABLE_CACHE ? provider : withCachedFundamentals(provider);
    }
  }
  throw new ProviderError(
    `No known FUNDAMENTALS_PROVIDER in "${list.join("|")}" — known: ${Object.keys(fundamentalsProviders).join(", ")}`,
    { provider: list[0] },
  );
}

export function getBrokerageProvider(): BrokerageProvider {
  const list = (process.env.BROKERAGE_PROVIDER ?? "ibkr").split("|");
  for (const key of list) {
    const factory = brokerageProviders[key.trim()];
    if (factory) {
      return factory();
    }
  }
  throw new ProviderError(
    `No known BROKERAGE_PROVIDER in "${list.join("|")}" — known: ${Object.keys(brokerageProviders).join(", ")}`,
    { provider: list[0] },
  );
}

export { alphaVantageProvider };
export * from "./types";
