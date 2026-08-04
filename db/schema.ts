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

// ── Admin Audit Logging ─────────────────────────────────────────────────────

export const apiCalls = sqliteTable(
  "api_calls",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    timestamp: text("timestamp").notNull(),
    provider: text("provider").notNull(), // 'fred' | 'newsapi' | 'finnhub' | 'alphavantage' | 'anthropic'
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull().default("GET"),
    statusCode: integer("status_code"),
    durationMs: integer("duration_ms"),
    recordsReturned: integer("records_returned"),
    error: text("error"),
  },
  (t) => [index("ix_api_calls_timestamp").on(t.timestamp), index("ix_api_calls_provider").on(t.provider)],
);

export const fileImports = sqliteTable(
  "file_imports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    timestamp: text("timestamp").notNull(),
    importType: text("import_type").notNull(), // 'transamerica_account' | 'csv_watchlist'
    filename: text("filename").notNull(),
    status: text("status").notNull(), // 'success' | 'failed'
    recordsProcessed: integer("records_processed"),
    recordsFailed: integer("records_failed").default(0),
    error: text("error"),
  },
  (t) => [index("ix_imports_timestamp").on(t.timestamp), index("ix_imports_type").on(t.importType)],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    timestamp: text("timestamp").notNull(),
    eventType: text("event_type").notNull(), // 'data_refresh' | 'watchlist_update' | 'portfolio_assessment' | 'login'
    userId: text("user_id"), // future: when auth is added
    action: text("action").notNull(),
    details: text("details"), // JSON
    status: text("status").notNull().default("success"), // 'success' | 'failed'
  },
  (t) => [index("ix_events_timestamp").on(t.timestamp), index("ix_events_type").on(t.eventType)],
);

// ── Epic E: News, Events & Narratives ──────────────────────────────────

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventDate: text("event_date").notNull(), // YYYY-MM-DD
    eventType: text("event_type").notNull(), // 'fomc_meeting' | 'cpi_release' | 'earnings' | 'economic' | 'political'
    title: text("title").notNull(),
    description: text("description"),
    instrumentId: integer("instrument_id").references(() => instruments.id), // null for macro events, populated for earnings
    impactDirection: text("impact_direction"), // 'bullish' | 'bearish' | 'neutral' | null
    source: text("source"), // 'fed' | 'bls' | 'company' | 'news' | etc
    url: text("url"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("ix_events_date").on(t.eventDate),
    index("ix_events_type").on(t.eventType),
    index("ix_events_instrument").on(t.instrumentId),
  ],
);

export const newsNarratives = sqliteTable(
  "news_narratives",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    instrumentId: integer("instrument_id").notNull().references(() => instruments.id),
    narrative: text("narrative").notNull(), // Claude-generated summary
    recentHeadlines: text("recent_headlines"), // JSON array of news titles used for context
    generatedAt: text("generated_at").notNull(),
    expiresAt: text("expires_at").notNull(), // TTL: narratives expire after 7 days
  },
  (t) => [
    index("ix_narratives_instrument").on(t.instrumentId),
    index("ix_narratives_generated").on(t.generatedAt),
  ],
);

// ── Epic G: Portfolio Assessment & Optimization ────────────────────────

export const funds = sqliteTable(
  "funds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fundName: text("fund_name").notNull(),
    fundCategory: text("fund_category").notNull(), // 'money_market' | 'bonds' | 'large_cap' | 'mid_cap' | 'intl' | 'target_date'
    inceptionDate: text("inception_date"), // YYYY-MM-DD
    unitShareValue: real("unit_share_value"),
    expenseRatioGross: real("expense_ratio_gross"), // Gross %
    expenseRatioNet: real("expense_ratio_net"), // Net %
    assetClassSlot: text("asset_class_slot"), // 'us_large_cap' | 'us_mid_cap' | 'bonds' | 'intl' | 'mm' | 'target_date'
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("ix_funds_category").on(t.fundCategory),
    index("ix_funds_assetclass").on(t.assetClassSlot),
  ],
);

export const fundPerformance = sqliteTable(
  "fund_performance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fundId: integer("fund_id").notNull().references(() => funds.id),
    asOf: text("as_of").notNull(), // Date of performance snapshot
    oneMonthPercent: real("one_month_percent"),
    threeMonthsPercent: real("three_months_percent"),
    ytdPercent: real("ytd_percent"),
    oneYearPercent: real("one_year_percent"),
    threeYearsPercent: real("three_years_percent"),
    fiveYearsPercent: real("five_years_percent"),
    tenYearsPercent: real("ten_years_percent"),
  },
  (t) => [
    index("ix_perf_fund").on(t.fundId),
    index("ix_perf_date").on(t.asOf),
  ],
);

export const optimizationSuggestions = sqliteTable(
  "optimization_suggestions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    accountId: integer("account_id").notNull().references(() => accounts.id),
    currentFundId: integer("current_fund_id").notNull().references(() => funds.id),
    suggestedFundId: integer("suggested_fund_id").notNull().references(() => funds.id),
    reason: text("reason").notNull(), // 'lower_expense_ratio' | 'better_performance' | 'similar_allocation_lower_cost'
    estimatedAnnualSavings: real("estimated_annual_savings"), // in dollars
    riskAdjustment: text("risk_adjustment"), // 'none' | 'higher' | 'lower'
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("ix_sugg_account").on(t.accountId),
    index("ix_sugg_currentfund").on(t.currentFundId),
  ],
);
