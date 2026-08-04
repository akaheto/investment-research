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
    const provider = getEquityProvider();

    // Get symbols from watchlist + instruments join
    const { watchlist } = await import("@/db/schema");
    const { instruments: instrumentsTable } = await import("@/db/schema");

    const watchlistItems = await db
      .select({ symbol: instrumentsTable.symbol })
      .from(watchlist)
      .innerJoin(instrumentsTable, eq(watchlist.instrumentId, instrumentsTable.id));

    const symbols = watchlistItems.map((item) => item.symbol);

    if (symbols.length > 0) {
      try {
        const quotes = await cachedFetch(
          provider.name,
          "quotes",
          { symbols },
          3600, // 1 hour TTL for quotes
          () => provider.getQuotes(symbols),
        );
        results.symbols += symbols.length;
        results.observations += Array.isArray(quotes) ? quotes.length : 0;
        console.log(`fetched ${symbols.length} quotes from ${provider.name}`);
      } catch (e) {
        results.errors.push(`quotes: ${String(e)}`);
      }
    }

    // FRED series refresh (T10Y2Y, DFF, UNRATE) is wired in with C4,
    // which defines which series the dashboard actually renders.

    // Epic E: Generate narratives for watchlist
    try {
      const { generateNarrativesForWatchlist } = await import("@/app/narratives/actions");
      await generateNarrativesForWatchlist();
    } catch (e) {
      console.warn("⚠️ Narrative generation failed:", e);
    }

    const elapsed = Date.now() - start;
    console.log(`refresh completed in ${elapsed}ms:`, results);
    return results;
  } catch (e) {
    console.error("refresh failed:", e);
    throw e;
  }
}
