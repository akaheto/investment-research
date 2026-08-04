/**
 * Provider cache layer — wraps API calls with TTL-based caching.
 * Reduces API calls by storing results in SQLite provider_cache table.
 * Each provider type has its own TTL: quotes (15min), fundamentals (24h), macro (1h).
 */

import { db } from "@/db/client";
import { providerCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logApiCall } from "@/lib/audit/tracker";

export interface CacheConfig {
  ttlSeconds: number;
  name: string;
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  quotes: { ttlSeconds: 15 * 60, name: "Price quotes" }, // 15 min
  fundamentals: { ttlSeconds: 24 * 60 * 60, name: "Fundamentals" }, // 24h
  macro: { ttlSeconds: 60 * 60, name: "Macro data" }, // 1h
  technicals: { ttlSeconds: 4 * 60 * 60, name: "Technical indicators" }, // 4h
};

export async function getCachedOrFetch<T>(
  cacheKey: string,
  cacheType: keyof typeof CACHE_CONFIGS,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const config = CACHE_CONFIGS[cacheType];
  if (!config) throw new Error(`Unknown cache type: ${cacheType}`);

  const now = Math.floor(Date.now() / 1000);

  try {
    // Check cache
    const cached = await db
      .select()
      .from(providerCache)
      .where(eq(providerCache.cacheKey, cacheKey))
      .limit(1);

    if (cached.length > 0) {
      const entry = cached[0];
      const age = now - entry.fetchedAt;

      if (age < entry.ttlSeconds) {
        // Cache hit — parse and return
        const payload = JSON.parse(entry.payloadJson) as T;
        return payload;
      }
    }

    // Cache miss or expired — fetch and store
    const startTime = Date.now();
    const result = await fetchFn();
    const duration = Date.now() - startTime;

    const payload = JSON.stringify(result);

    // Upsert cache entry (replace if exists, insert if not)
    await db
      .delete(providerCache)
      .where(eq(providerCache.cacheKey, cacheKey));

    await db.insert(providerCache).values({
      cacheKey,
      fetchedAt: now,
      ttlSeconds: config.ttlSeconds,
      payloadJson: payload,
    });

    logApiCall({
      provider: "cache",
      endpoint: cacheKey,
      statusCode: 200,
      durationMs: duration,
      recordsReturned: 1,
    });

    return result;
  } catch (err) {
    console.error(`Cache error for ${cacheKey}:`, err);
    // Fallback: fetch without cache on error
    return fetchFn();
  }
}

export async function getCacheStats() {
  const entries = await db.select().from(providerCache);
  const now = Math.floor(Date.now() / 1000);

  const stats = {
    totalEntries: entries.length,
    fresh: 0,
    stale: 0,
    byType: {} as Record<string, { count: number; fresh: number }>,
  };

  for (const entry of entries) {
    const age = now - entry.fetchedAt;
    const isFresh = age < entry.ttlSeconds;

    if (isFresh) stats.fresh++;
    else stats.stale++;

    const typeKey = entry.cacheKey.split(":")[0] || "unknown";
    if (!stats.byType[typeKey]) stats.byType[typeKey] = { count: 0, fresh: 0 };
    stats.byType[typeKey].count++;
    if (isFresh) stats.byType[typeKey].fresh++;
  }

  return stats;
}

export async function clearExpiredCache() {
  const now = Math.floor(Date.now() / 1000);
  const entries = await db.select().from(providerCache);

  let cleared = 0;
  for (const entry of entries) {
    const age = now - entry.fetchedAt;
    if (age >= entry.ttlSeconds) {
      await db.delete(providerCache).where(eq(providerCache.cacheKey, entry.cacheKey));
      cleared++;
    }
  }

  return cleared;
}
