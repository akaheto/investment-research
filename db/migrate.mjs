/**
 * Applies committed SQL migrations (db/migrations) to the configured DB.
 * Run: npm run db:migrate — targets file:local.db by default, or Turso
 * when TURSO_DATABASE_URL/DATABASE_URL + TURSO_AUTH_TOKEN are set (mirrors
 * db/client.ts). Plain .mjs so it runs under `node` without a TS loader.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const dbUrl = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:local.db";
console.log(`Migrating: ${dbUrl.startsWith("file:") ? dbUrl : dbUrl.split("@")[0] + "@***"}`);

const db = drizzle(
  createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
);
await migrate(db, { migrationsFolder: "./db/migrations" });
console.log("migrations applied");
