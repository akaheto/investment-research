/**
 * Schema v1 — mirrors TECHNICAL_SPEC.docx § Data Model. Any change here
 * lands in the same commit as the spec update (project rule).
 *
 * Conventions:
 * - Dates/timestamps are ISO-8601 TEXT (SQLite-native, sorts correctly).
 * - Fundamentals are long/narrow (metric, value) so new provider metrics
 *   need no migration.
 * - Money/metric values are REAL; `balance` is dollars, `units` is shares.
 */
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ── Market data ────────────────────────────────────────────────────────

export const instruments = sqliteTable(
  "instruments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    /** 'stock' | 'etf' | 'crypto' | 'bond_proxy' | 'index' */
    assetClass: text("asset_class").notNull(),
    sector: text("sector"),
    currency: text("currency").notNull().default("USD"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  // Same ticker can exist across classes (e.g. a crypto colliding with a stock symbol)
  (t) => [uniqueIndex("uq_instruments_symbol_class").on(t.symbol, t.assetClass)],
);

export const pricesDaily = sqliteTable(
  "prices_daily",
  {
    instrumentId: integer("instrument_id").notNull().references(() => instruments.id),
    date: text("date").notNull(), // YYYY-MM-DD
    open: real("open"),
    high: real("high"),
    low: real("low"),
    close: real("close").notNull(),
    volume: real("volume"),
  },
  (t) => [primaryKey({ columns: [t.instrumentId, t.date] })],
);

export const fundamentalsSnapshots = sqliteTable(
  "fundamentals_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    instrumentId: integer("instrument_id").notNull().references(() => instruments.id),
    asOf: text("as_of").notNull(),
    metric: text("metric").notNull(), // e.g. 'pe_ttm', 'fcf_yield'
    value: real("value").notNull(),
  },
  (t) => [uniqueIndex("uq_fundamentals").on(t.instrumentId, t.metric, t.asOf)],
);

export const factorScores = sqliteTable(
  "factor_scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    instrumentId: integer("instrument_id").notNull().references(() => instruments.id),
    runAt: text("run_at").notNull(),
    /** 'valuation' | 'growth' | 'quality' | 'momentum' | 'composite' */
    factor: text("factor").notNull(),
    rawScore: real("raw_score"),
    percentile: real("percentile").notNull(),
    weightsPresetId: text("weights_preset_id").notNull().default("balanced"),
    /** 'full' | 'low' — low when < half of a factor's metrics were available */
    confidence: text("confidence").notNull().default("full"),
  },
  (t) => [index("ix_scores_instrument_run").on(t.instrumentId, t.runAt)],
);

export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  instrumentId: integer("instrument_id").notNull().unique().references(() => instruments.id),
  addedAt: text("added_at").notNull(),
  note: text("note"),
  targetPrice: real("target_price"),
});

export const macroSeries = sqliteTable(
  "macro_series",
  {
    seriesId: text("series_id").notNull(), // FRED id, e.g. 'T10Y2Y'
    date: text("date").notNull(),
    value: real("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.seriesId, t.date] })],
);

export const newsItems = sqliteTable(
  "news_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publishedAt: text("published_at").notNull(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    tickersCsv: text("tickers_csv"),
    dedupeHash: text("dedupe_hash").notNull(),
  },
  (t) => [uniqueIndex("uq_news_dedupe").on(t.dedupeHash)],
);

export const providerCache = sqliteTable("provider_cache", {
  cacheKey: text("cache_key").primaryKey(),
  fetchedAt: integer("fetched_at").notNull(), // epoch seconds
  ttlSeconds: integer("ttl_seconds").notNull(),
  payloadJson: text("payload_json").notNull(),
});

// ── Portfolio (Epic G — Transamerica accounts) ─────────────────────────

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  institution: text("institution").notNull().default("Transamerica"),
  /** '401k' | 'ira' | 'taxable' */
  taxType: text("tax_type").notNull(),
  createdAt: text("created_at").notNull(),
});

export const planMenu = sqliteTable(
  "plan_menu",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    accountId: integer("account_id").notNull().references(() => accounts.id),
    fundName: text("fund_name").notNull(),
    /** Comparison slot for swap suggestions, e.g. 'us_large_cap', 'intl_developed', 'bond_core' */
    assetClassSlot: text("asset_class_slot").notNull(),
    expenseRatio: real("expense_ratio"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("uq_plan_fund").on(t.accountId, t.fundName)],
);

export const holdings = sqliteTable(
  "holdings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    accountId: integer("account_id").notNull().references(() => accounts.id),
    planFundId: integer("plan_fund_id").notNull().references(() => planMenu.id),
    units: real("units"),
    balance: real("balance").notNull(),
    asOf: text("as_of").notNull(),
    /** 'manual' | 'csv' */
    source: text("source").notNull(),
  },
  // Snapshots over time: one row per fund per as-of date
  (t) => [uniqueIndex("uq_holding_snapshot").on(t.accountId, t.planFundId, t.asOf)],
);

export const proxyMap = sqliteTable("proxy_map", {
  planFundId: integer("plan_fund_id").primaryKey().references(() => planMenu.id),
  instrumentId: integer("instrument_id").notNull().references(() => instruments.id),
  mappingNote: text("mapping_note"),
  /** 'exact' (same fund/share class) | 'close' (index equivalent) | 'loose' (active CIT proxy) */
  confidence: text("confidence").notNull(),
});

export const assessments = sqliteTable("assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  runAt: text("run_at").notNull(),
  /** Layer 1 snapshot: scores, allocation, cost drag, suggestions (JSON) */
  deterministicJson: text("deterministic_json").notNull(),
  /** Layer 2: Claude-written narrative; must only reference cited events */
  narrativeText: text("narrative_text"),
  citedEventIdsCsv: text("cited_event_ids_csv"),
  modelId: text("model_id"),
});
