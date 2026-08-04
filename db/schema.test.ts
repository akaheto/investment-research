import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { accounts, holdings, instruments, planMenu, pricesDaily } from "@/db/schema";

// Fresh in-memory DB with the real committed migrations applied — the
// test proves the migration files themselves produce a working schema.
const db = createDb(":memory:");

/** Drizzle wraps libSQL errors; the SQLite detail lives in error.cause. */
async function expectDbError(promise: Promise<unknown>, pattern: RegExp) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err, "expected the query to fail").not.toBeNull();
  const full = `${String(err)} ${String((err as Error).cause ?? "")}`;
  expect(full).toMatch(pattern);
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./db/migrations" });
});

describe("schema v1 migrations", () => {
  it("supports the instrument → price roundtrip", async () => {
    const [row] = await db
      .insert(instruments)
      .values({ symbol: "VTI", name: "Vanguard Total Stock Market ETF", assetClass: "etf" })
      .returning();
    expect(row.id).toBeGreaterThan(0);
    expect(row.currency).toBe("USD"); // default applied

    await db.insert(pricesDaily).values({ instrumentId: row.id, date: "2026-08-03", close: 312.4 });
    const prices = await db.select().from(pricesDaily);
    expect(prices).toHaveLength(1);
    expect(prices[0].close).toBe(312.4);
  });

  // Unhappy path: same symbol may exist across asset classes, but not within one
  it("rejects a duplicate symbol within the same asset class", async () => {
    await db.insert(instruments).values({ symbol: "UNI", name: "Uniswap", assetClass: "crypto" });
    await expectDbError(
      db.insert(instruments).values({ symbol: "UNI", name: "Duplicate", assetClass: "crypto" }),
      /UNIQUE/i,
    );
    // ...but the same symbol as a stock is allowed
    await expect(
      db.insert(instruments).values({ symbol: "UNI", name: "Universal Corp", assetClass: "stock" }),
    ).resolves.not.toThrow();
  });

  it("stores account → plan fund → holdings snapshots (Epic G path)", async () => {
    const [acct] = await db
      .insert(accounts)
      .values({ name: "Transamerica 401k A", taxType: "401k", createdAt: "2026-08-03" })
      .returning();
    const [fund] = await db
      .insert(planMenu)
      .values({ accountId: acct.id, fundName: "Large Cap Index", assetClassSlot: "us_large_cap", expenseRatio: 0.05 })
      .returning();
    await db.insert(holdings).values({
      accountId: acct.id, planFundId: fund.id, balance: 25000, asOf: "2026-08-03", source: "manual",
    });

    // Unhappy path: same fund + same as-of date is one snapshot, not two
    await expectDbError(
      db.insert(holdings).values({
        accountId: acct.id, planFundId: fund.id, balance: 99999, asOf: "2026-08-03", source: "manual",
      }),
      /UNIQUE/i,
    );
    // A later as-of date is a new snapshot — history is preserved
    await expect(
      db.insert(holdings).values({
        accountId: acct.id, planFundId: fund.id, balance: 26100, asOf: "2026-09-01", source: "csv",
      }),
    ).resolves.not.toThrow();
  });

  // Unhappy path: required fields are actually required
  it("rejects a holding with no balance", async () => {
    await expectDbError(
      db.insert(holdings).values({
        accountId: 1, planFundId: 1, balance: null as unknown as number, asOf: "2026-10-01", source: "manual",
      }),
      /NOT NULL/i,
    );
  });
});
