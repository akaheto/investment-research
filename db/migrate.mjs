/**
 * Applies committed SQL migrations (db/migrations) to the configured DB.
 * Run: npm run db:migrate — targets file:local.db by default, or Turso
 * when TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are set (mirrors db/client.ts).
 * Plain .mjs so it runs under `node` without a TS loader.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const db = drizzle(
  createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
);
await migrate(db, { migrationsFolder: "./db/migrations" });
console.log("migrations applied");
