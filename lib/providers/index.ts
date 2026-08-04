/**
 * Provider registry — env-driven selection with fallback support (B7).
 * Each PROVIDER env var can be a single provider or a pipe-separated list
 * for fallback: "primary|fallback|fallback".
 * Example: EQUITY_PROVIDER="fmp|yahoo" tries FMP first, falls back to Yahoo.
 */
import { type EquityProvider, ProviderError } from "./types";
import { YahooEquityProvider } from "./yahoo";
import { CoinGeckoCryptoProvider } from "./coingecko";
import { FredMacroProvider } from "./fred";

const equityProviders: Record<string, () => EquityProvider> = {
  yahoo: () => new YahooEquityProvider(),
  // future: fmp, polygon, tiingo, alpaca — added here, selected by env only
};

const cryptoProviders: Record<string, () => EquityProvider> = {
  coingecko: () => new CoinGeckoCryptoProvider(),
  // future: binance, bybit, kraken (with API key)
};

const macroProviders: Record<string, () => any> = {
  fred: () => new FredMacroProvider(),
  // future: ecb, ons, statscan
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
    if (factory) return factory();
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
    if (factory) return factory();
  }
  throw new ProviderError(
    `No known CRYPTO_PROVIDER in "${list.join("|")}" — known: ${Object.keys(cryptoProviders).join(", ")}`,
    { provider: list[0] },
  );
}

export function getMacroProvider(): any {
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

export * from "./types";
