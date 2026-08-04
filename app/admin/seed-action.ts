"use server";

/**
 * Seed Mag 7 stocks into watchlist.
 */

import { db } from "@/db/client";
import { instruments, watchlist } from "@/db/schema";
import { logAuditEvent } from "@/lib/audit/tracker";
import { eq, and } from "drizzle-orm";

const MAG_7 = [
  { symbol: "AAPL", name: "Apple", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon", sector: "Consumer Cyclical" },
  { symbol: "TSLA", name: "Tesla", sector: "Automotive" },
  { symbol: "META", name: "Meta", sector: "Technology" },
  { symbol: "NVDA", name: "Nvidia", sector: "Technology" },
];

export async function seedMag7() {
  try {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Seeding Mag 7 stocks",
      details: { count: MAG_7.length },
    });

    const added = [];

    for (const stock of MAG_7) {
      try {
        // Insert or get instrument
        const existing = await db
          .select()
          .from(instruments)
          .where(
            and(
              eq(instruments.symbol, stock.symbol),
              eq(instruments.assetClass, "stock")
            )
          );

        let instrumentId: number;

        if (existing.length > 0) {
          instrumentId = existing[0].id;
        } else {
          const result = await db
            .insert(instruments)
            .values({
              symbol: stock.symbol,
              name: stock.name,
              assetClass: "stock",
              sector: stock.sector,
              currency: "USD",
              active: true,
            })
            .returning();

          instrumentId = result[0].id;
        }

        // Add to watchlist if not already there
        const inWatchlist = await db
          .select()
          .from(watchlist)
          .where(eq(watchlist.instrumentId, instrumentId));

        if (inWatchlist.length === 0) {
          await db.insert(watchlist).values({
            instrumentId,
            addedAt: new Date().toISOString(),
            note: "Mag 7 seed",
          });
        }

        added.push(stock.symbol);
      } catch (err) {
        console.error(`Failed to add ${stock.symbol}:`, err);
      }
    }

    logAuditEvent({
      eventType: "data_refresh",
      action: "Mag 7 seed completed",
      status: "success",
      details: { added },
    });

    return { ok: true, added, message: `Added ${added.length} stocks to watchlist` };
  } catch (error) {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Mag 7 seed failed",
      status: "failed",
      details: { error: String(error) },
    });

    return { ok: false, error: String(error) };
  }
}
