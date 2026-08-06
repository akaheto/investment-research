"use server";

import { db } from "@/db/client";
import { instruments, watchlist } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface SectorBreakdown {
  sector: string;
  count: number;
}

/**
 * Get sector breakdown of the watchlist.
 * Groups watchlist items by sector, returns counts.
 */
export async function getSectorBreakdown(): Promise<SectorBreakdown[]> {
  try {
    const watchlistItems = await db
      .select({
        sector: instruments.sector,
      })
      .from(watchlist)
      .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id));

    // Group by sector
    const bySector: Record<string, number> = {};
    for (const item of watchlistItems) {
      const s = item.sector || "Other";
      bySector[s] = (bySector[s] || 0) + 1;
    }

    // Convert to array and sort by count descending
    const result = Object.entries(bySector)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);

    return result;
  } catch (error) {
    console.error("Failed to get sector breakdown:", error);
    return [];
  }
}
