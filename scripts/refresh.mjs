/**
 * Local refresh runner — npm run refresh
 * Applies pending refreshes to the local database.
 * Mirrors /api/refresh but runs synchronously in the CLI.
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const db = drizzle(createClient({ url: process.env.TURSO_DATABASE_URL ?? "file:local.db", authToken: process.env.TURSO_AUTH_TOKEN }));

// Apply pending migrations first
await migrate(db, { migrationsFolder: "./db/migrations" });

// TODO: Implement the full refresh logic once B6 is complete.
// For now, just log that the infrastructure is in place.
console.log("refresh infrastructure ready; full implementation in B6");
console.log("database:", process.env.TURSO_DATABASE_URL ?? "file:local.db");
