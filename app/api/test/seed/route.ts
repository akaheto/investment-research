/**
 * Test endpoint: POST /api/test/seed
 * Populate database with test instruments and watchlist entries for testing.
 * TODO: Remove before production.
 */

import { db } from "@/db/client";
import { instruments, watchlist } from "@/db/schema";
import { eq } from "drizzle-orm";

const TEST_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "VTI", "BND"];

export async function POST() {
  try {
    console.log("🌱 Seeding test data...");

    // Insert test instruments
    for (const symbol of TEST_SYMBOLS) {
      const existing = await db.select().from(instruments).where(eq(instruments.symbol, symbol));
      if (existing.length === 0) {
        await db.insert(instruments).values({
          symbol,
          name: `${symbol} Test Instrument`,
          assetClass: symbol === "BND" ? "etf" : symbol === "VTI" ? "etf" : "stock",
          currency: "USD",
          active: true,
        });
      }
    }

    // Add to watchlist
    const instrumentList = await db.select().from(instruments);
    for (const inst of instrumentList) {
      const existing = await db.select().from(watchlist).where(eq(watchlist.instrumentId, inst.id));
      if (existing.length === 0) {
        await db.insert(watchlist).values({
          instrumentId: inst.id,
          addedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`✓ Seeded ${TEST_SYMBOLS.length} instruments`);

    return Response.json(
      {
        ok: true,
        message: `Seeded ${TEST_SYMBOLS.length} test instruments`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Seed failed:", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
