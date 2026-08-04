/**
 * Env-driven database client (the free→paid / local→hosted seam):
 * - Local dev: no env needed → file:local.db in the repo root (gitignored).
 * - Vercel: TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) point the same client
 *   at Turso. No code changes between environments.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export function createDb(url?: string) {
  const client = createClient({
    url: url ?? process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

/** App-wide singleton; tests create their own via createDb(":memory:"). */
export const db = createDb();
