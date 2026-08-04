/**
 * Test endpoint: POST /api/test/full-setup
 * One-shot setup: seed instruments → import portfolio → compute scores → fetch macro.
 * TODO: Remove before production.
 */

import { db } from "@/db/client";
import { instruments, watchlist } from "@/db/schema";
import { eq } from "drizzle-orm";
import { runRefresh } from "@/lib/refresh";
import { importTransamericaAccounts } from "@/app/portfolio/actions";

export const maxDuration = 300; // 5 min timeout for full setup

const TEST_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "VTI", "BND"];

export async function POST() {
  const steps: Array<{ step: string; status: "ok" | "error"; message?: string }> = [];

  try {
    // Step 1: Seed instruments
    console.log("Step 1: Seeding instruments...");
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
    steps.push({ step: "Seed instruments", status: "ok", message: "6 test symbols added" });

    // Step 2: Import portfolio
    console.log("Step 2: Importing portfolio...");
    const importResult = await importTransamericaAccounts();
    if (!importResult.ok) throw new Error("Import failed");
    steps.push({ step: "Import portfolio", status: "ok", message: `${importResult.accountCount} accounts imported` });

    // Step 3: Refresh data (fetch quotes)
    console.log("Step 3: Refreshing data...");
    const refreshResult = await runRefresh();
    steps.push({ step: "Refresh data", status: "ok", message: `${refreshResult.symbols} symbols fetched` });

    // Step 4 & 5: Scores + Macro (helper functions in development)
    steps.push({ step: "Compute scores", status: "ok", message: "Skipped (in dev)" });
    steps.push({ step: "Fetch macro", status: "ok", message: "Skipped (in dev)" });

    return Response.json({ ok: true, steps }, { status: 200 });
  } catch (error) {
    console.error("Full setup failed:", error);
    steps.push({ step: "Error", status: "error", message: String(error) });
    return Response.json({ ok: false, steps, error: String(error) }, { status: 500 });
  }
}
