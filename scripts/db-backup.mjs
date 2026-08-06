/**
 * Full logical backup of the configured database.
 *
 * Dumps every user table's schema + rows to a timestamped JSON file under
 * backups/ (gitignored — the dump contains real account data).
 *
 * Usage:
 *   node --env-file=.env.production scripts/db-backup.mjs
 *   node scripts/db-backup.mjs                 # falls back to file:local.db
 */
import { createClient } from "@libsql/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const url =
  process.env.TURSO_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

const client = createClient({ url, ...(authToken && { authToken }) });

// sqlite_% and _litestream_% are engine-internal; a logical dump must skip them.
const { rows: tables } = await client.execute(
  `SELECT name, sql FROM sqlite_master
   WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%'
   ORDER BY name`,
);

const dump = {
  takenAt: new Date().toISOString(),
  source: url.replace(/\/\/.*@/, "//<redacted>@"),
  tables: {},
};

let grandTotal = 0;
for (const { name, sql } of tables) {
  const { rows } = await client.execute(`SELECT * FROM "${name}"`);
  dump.tables[name] = { createSql: sql, rowCount: rows.length, rows };
  grandTotal += rows.length;
  console.log(`  ${String(rows.length).padStart(6)}  ${name}`);
}

const dir = resolve("backups");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = resolve(dir, `backup-${stamp}.json`);
writeFileSync(file, JSON.stringify(dump, null, 2));

console.log(`\n${tables.length} tables, ${grandTotal} rows`);
console.log(`Written to ${file}`);
