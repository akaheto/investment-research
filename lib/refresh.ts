/**
 * Refresh pipeline with provider caching and rate-limit handling.
 * - Wraps each provider's network calls
 * - TTL-based cache in the database (provider_cache table)
 * - Per-provider rate-limit delays (generous for free tiers)
 * - Callable from npm run refresh (local) or /api/refresh (Vercel cron)
 */
import { db } from "@/db/client";
import { providerCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEquityProvider } from "@/lib/providers";

const RATE_LIMITS = {
  yahoo: 100, // ms between requests
  coingecko: 50,
  fred: 200, // FRED is stricter
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cached fetch: hit DB cache first, network on miss or expiry.
 * Cache key is deterministic: "provider:operation:args" (JSON stringified).
 */
export async function cachedFetch<T>(
  provider: string,
  operation: string,
  args: unknown,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cacheKey = `${provider}:${operation}:${JSON.stringify(args)}`;
  const cached = await db.select().from(providerCache).where(eq(providerCache.cacheKey, cacheKey));
  const now = Math.floor(Date.now() / 1000);

  if (cached.length > 0 && cached[0].fetchedAt + cached[0].ttlSeconds > now) {
    return JSON.parse(cached[0].payloadJson);
  }

  // Rate limit before the network call
  const rl = RATE_LIMITS[provider as keyof typeof RATE_LIMITS] ?? 100;
  await sleep(rl);

  // Fetch and cache
  const result = await fetcher();
  const payloadJson = JSON.stringify(result);
  if (cached.length > 0) {
    await db
      .update(providerCache)
      .set({ fetchedAt: now, ttlSeconds, payloadJson })
      .where(eq(providerCache.cacheKey, cacheKey));
  } else {
    await db.insert(providerCache).values({ cacheKey, fetchedAt: now, ttlSeconds, payloadJson });
  }
  return result;
}

/**
 * Refresh all configured data sources.
 * Called by npm run refresh (local) or /api/refresh (Vercel cron).
 * Returns a summary of what was updated.
 */
export async function runRefresh() {
  const start = Date.now();
  const results = { symbols: 0, observations: 0, errors: [] as string[] };

  try {
    // Refresh equities watchlist from the latest known symbols
    // (Full implementation deferred to Epic B6 iteration; this outlines the shape)
    const provider = getEquityProvider();
    const symbols: string[] = []; // TODO: join instruments + watchlist to get symbols
    if (symbols.length > 0) {
      try {
        await cachedFetch(
          provider.name,
          "quotes",
          { symbols },
          3600, // 1 hour TTL for quotes
          () => provider.getQuotes(symbols),
        );
        results.symbols += symbols.length;
      } catch (e) {
        results.errors.push(`quotes: ${String(e)}`);
      }
    }

    // Refresh FRED series (yield curve: T10Y2Y, rates, etc.)
    // For now, a minimal set; later configurable by the user's portfolios
    const fredSeries = ["T10Y2Y", "DFF", "UNRATE"];
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    // Note: FRED provider would live here; for now stub it
    results.observations += 0; // placeholder

    const elapsed = Date.now() - start;
    console.log(`refresh completed in ${elapsed}ms:`, results);
    return results;
  } catch (e) {
    console.error("refresh failed:", e);
    throw e;
  }
}
