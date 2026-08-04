/**
 * Provider registry — env-driven selection (the B7 upgrade path starts
 * here): set EQUITY_PROVIDER to swap implementations, no call sites change.
 */
import { type EquityProvider, ProviderError } from "./types";
import { YahooEquityProvider } from "./yahoo";

const equityProviders: Record<string, () => EquityProvider> = {
  yahoo: () => new YahooEquityProvider(),
  // future: fmp, polygon, tiingo — added here, selected by env only
};

export function getEquityProvider(): EquityProvider {
  const key = process.env.EQUITY_PROVIDER ?? "yahoo";
  const factory = equityProviders[key];
  if (!factory) {
    throw new ProviderError(
      `Unknown EQUITY_PROVIDER "${key}" — known: ${Object.keys(equityProviders).join(", ")}`,
      { provider: key },
    );
  }
  return factory();
}

export * from "./types";
