/**
 * Generates TECHNICAL_SPEC.docx.
 * The Signal Logic section is a user-mandated, always-current, detailed
 * explanation of how "good investments" are identified — update it in the
 * same change as any scoring-code change.
 */
import { bullet, h1, h2, h3, note, p, table, titlePage, TODAY, writeDoc } from "./helpers.mjs";

await writeDoc("TECHNICAL_SPEC.docx", [
  ...titlePage("Technical Specification", "Investment Research Dashboard", TODAY),

  h1("1. Overview"),
  p("A single-user investment-research dashboard aggregating market data, fundamentals, macro indicators, and news for stocks, ETFs, crypto, and bonds. Data arrives through provider-agnostic connectors on free tiers, is cached in a local SQL database, and feeds a deterministic factor-scoring engine that ranks candidates transparently. The app runs locally on macOS and deploys to Vercel unchanged."),

  h1("2. Architecture"),
  bullet([{ text: "Web app: ", bold: true }, { text: "Next.js 16 (App Router) + React 19 + TypeScript. Server components/route handlers do all data access; API keys never reach the client." }]),
  bullet([{ text: "Connector layer: ", bold: true }, { text: "lib/providers/* — one interface per data domain (quotes, history, fundamentals, crypto, macro, news), with concrete free-tier implementations. Provider choice is env-driven (B7), so upgrading to a paid provider is configuration, not a rewrite." }]),
  bullet([{ text: "Storage: ", bold: true }, { text: "libSQL via Drizzle ORM. Locally a plain file (file:local.db); on Vercel the same client points at Turso (free tier). Identical SQLite semantics both places." }]),
  bullet([{ text: "Refresh pipeline: ", bold: true }, { text: "npm run refresh locally; on Vercel a cron job calls /api/refresh, guarded by CRON_SECRET. Connectors cache responses and respect per-provider rate limits." }]),
  bullet([{ text: "Signal engine: ", bold: true }, { text: "pure TypeScript functions (lib/signals/*) over the cached data — deterministic, unit-tested, no network access at score time." }]),

  h1("3. Tech Stack"),
  table(["Layer", "Choice", "Why / tradeoff"], [
    ["Framework", "Next.js 16.3, React 19.2, TypeScript 5", "One language end-to-end; Vercel-native. Python has richer finance libs but doubles the maintenance surface."],
    ["Styling", "Tailwind CSS 4", "Token-driven; style-guide values map to CSS variables."],
    ["Database", "libSQL + Drizzle ORM", "SQLite locally, Turso on Vercel — plain better-sqlite3 was rejected because Vercel's filesystem is ephemeral."],
    ["Testing / Lint", "Vitest 4 / ESLint 9", "Fast, TS-native; lint ships with the scaffold."],
    ["Charts", "Recharts (planned, Epic C)", "Declarative, fits the dataviz method; revisit for candlesticks if needed."],
    ["Data (equities/ETFs)", "yahoo-finance2 (free, unofficial)", "Rich quotes/history/fundamentals at $0. Risk: unofficial API can break — mitigated by the provider interface; FMP (~$30–50/mo) is the named upgrade."],
    ["Data (crypto)", "CoinGecko free tier", "Solid free coverage of prices/mcap/volume."],
    ["Data (macro/rates)", "FRED API (free key)", "Authoritative yields, curve, CPI, unemployment."],
    ["Data (news/filings)", "RSS feeds + SEC EDGAR (free)", "Headlines and filings; paid news APIs are a later upgrade."],
    ["Docs", "docx npm package via scripts/gen-docs", "All .docx are generated; never hand-edited."],
  ], { widths: [16, 30, 54] }),

  h1("4. Data Model (v1 plan — implemented in Epic B1)"),
  table(["Table", "Purpose", "Key columns"], [
    ["instruments", "Everything trackable: stock, ETF, crypto, bond-proxy, index", "id, symbol, name, assetClass, sector, currency, active"],
    ["prices_daily", "EOD OHLCV history per instrument", "instrumentId, date, open, high, low, close, volume (unique instrumentId+date)"],
    ["fundamentals_snapshots", "Point-in-time fundamentals per instrument", "instrumentId, asOf, metric, value (long/narrow — new metrics need no migration)"],
    ["factor_scores", "Output of each scoring run, kept for history", "instrumentId, runAt, factor, rawScore, percentile, weightsPresetId, confidence"],
    ["watchlist", "User's tracked instruments + notes", "instrumentId, addedAt, note, targetPrice"],
    ["macro_series", "FRED series observations", "seriesId, date, value"],
    ["news_items", "Ingested headlines with ticker tags", "id, publishedAt, source, title, url, tickersCsv, dedupeHash"],
    ["provider_cache", "Raw API response cache with TTL", "cacheKey, fetchedAt, ttlSeconds, payloadJson"],
  ], { widths: [20, 34, 46] }),
  note("Long/narrow fundamentals and a persisted score history are deliberate: metrics vary by provider, and score history enables later backtesting without schema changes."),

  h1("5. Key Decisions & Tradeoffs"),
  bullet([{ text: "Free tier now, upgrade by config (user decision 2026-08-03): ", bold: true }, { text: "every provider sits behind an interface; the paid swap touches env vars and one adapter file." }]),
  bullet([{ text: "Vercel-deployable from day one (user decision 2026-08-03): ", bold: true }, { text: "drove libSQL-over-SQLite-file, the /api/refresh cron shape, and keeping secrets server-side." }]),
  bullet([{ text: "Deterministic scores, LLM for narrative only (user decision 2026-08-03): ", bold: true }, { text: "auditability and backtestability beat flexibility; an LLM can misread numbers with confidence." }]),
  bullet([{ text: "Bonds via macro + ETF proxies in v1: ", bold: true }, { text: "individual-bond data is premium-priced and fragmented; the yield curve and bond ETFs carry most of a personal investor's decision weight." }]),
  bullet([{ text: "Crypto scored on its own scale: ", bold: true }, { text: "no earnings → no valuation factor; comparing a crypto score to an equity score would be false precision." }]),

  h1("6. Signal Logic (detailed — kept current with the code, per user instruction)"),
  p([{ text: "Goal: rank instruments by the likelihood that they are attractive investments, using transparent rules a human can audit. Every composite score can be decomposed to the exact metrics, raw values, percentiles, and weights that produced it. Nothing in this section is produced by an LLM.", italics: true }]),

  h2("6.1 Universe & comparison groups"),
  bullet("Scored universe = the user's watchlist plus a configurable base universe (initially S&P 500 constituents + a curated ETF list). Crypto universe: top ~100 by market cap, memecoins excluded by default."),
  bullet("Valuation and quality percentiles are computed within sector (a bank's P/B vs banks, not vs software). Momentum percentiles are computed across the whole equity universe, because momentum is a cross-sectional phenomenon."),

  h2("6.2 Factor families (equities)"),
  h3("Valuation — is it cheap for what it is?"),
  table(["Metric", "Direction", "Notes"], [
    ["P/E (trailing 12m)", "lower = better", "Ignored if earnings ≤ 0 (does not default to 'expensive')"],
    ["Forward P/E", "lower = better", "Only when analyst estimates exist"],
    ["EV / EBITDA", "lower = better", "Capital-structure-neutral cross-check on P/E"],
    ["P/S (trailing)", "lower = better", "Carries weight when earnings are negative"],
    ["P/B", "lower = better", "Sector-sensitive; only meaningful within sector group"],
    ["FCF yield (FCF / market cap)", "higher = better", "The hardest metric to game"],
  ], { widths: [34, 22, 44] }),
  h3("Growth — is the business expanding?"),
  table(["Metric", "Direction", "Notes"], [
    ["Revenue growth, 3y CAGR", "higher = better", "Smooths one-off years"],
    ["Revenue growth, TTM YoY", "higher = better", "Captures inflections the CAGR hides"],
    ["EPS growth, TTM YoY", "higher = better", "Ignored when base-year EPS ≤ 0"],
    ["FCF growth, 3y", "higher = better", "Growth that isn't accrual accounting"],
  ], { widths: [34, 22, 44] }),
  h3("Quality — is it a good business?"),
  table(["Metric", "Direction", "Notes"], [
    ["Return on equity (ROE)", "higher = better", "Capped consideration when driven by extreme leverage"],
    ["Return on invested capital (ROIC)", "higher = better", "Preferred over ROE where computable"],
    ["Gross margin + 3y trend", "higher / improving = better", "Pricing power proxy"],
    ["Operating margin + 3y trend", "higher / improving = better", ""],
    ["Debt / equity", "lower = better", "Sector-relative (utilities vs software)"],
    ["Interest coverage (EBIT / interest)", "higher = better", "Distress guard"],
  ], { widths: [34, 22, 44] }),
  h3("Momentum — is the market agreeing?"),
  table(["Metric", "Direction", "Notes"], [
    ["12-month return, skipping the most recent month (12-1)", "higher = better", "The classic academic momentum measure; the skip avoids short-term reversal"],
    ["6-month return", "higher = better", ""],
    ["Price vs 200-day moving average", "above = better", "Trend filter"],
    ["Distance from 52-week high", "closer = better", "Anchoring/breakout proxy"],
    ["Return relative to benchmark (SPY), 6m", "higher = better", "Separates stock strength from market strength"],
  ], { widths: [34, 22, 44] }),

  h2("6.3 Normalization — from raw metrics to scores"),
  bullet([{ text: "Winsorize: ", bold: true }, { text: "each metric is clamped at its 2nd and 98th percentile within the comparison group, so one broken value (a 40,000% growth print from a near-zero base) cannot distort the distribution." }]),
  bullet([{ text: "Percentile rank: ", bold: true }, { text: "the winsorized value maps to 0–100 within its comparison group, direction-adjusted so 100 is always 'good' (cheap valuation, high growth, high quality, strong momentum)." }]),
  bullet([{ text: "Factor score: ", bold: true }, { text: "equal-weighted mean of that factor's available metric percentiles." }]),
  bullet([{ text: "Missing data policy: ", bold: true }, { text: "a missing metric is excluded and the remaining metrics reweighted — never imputed to the median. If fewer than half a factor's metrics exist, the factor is flagged low-confidence, shown with a warning, and the composite carries the flag. Low-confidence names are never silently ranked as average." }]),

  h2("6.4 Composite score & presets"),
  p("Composite (0–100) = weighted mean of the four factor scores. Default preset is Balanced: 25% valuation, 25% growth, 25% quality, 25% momentum. Named presets shift emphasis: Value tilt (40/15/30/15), Growth tilt (15/40/25/20), Quality tilt (20/20/45/15). Weights are user-tunable; every screener result records which preset produced it."),
  bullet([{ text: "Auditability rule: ", bold: true }, { text: "clicking any score opens its decomposition — every metric's raw value, winsorized value, percentile, comparison group, and weight. If a score can't explain itself, it doesn't ship." }]),

  h2("6.5 ETFs"),
  bullet("Momentum: same as equities."),
  bullet("Cost & structure: expense ratio (lower better), AUM and average spread (liquidity guards), holdings concentration (top-10 weight)."),
  bullet("Look-through valuation (fund-level P/E, P/B) where the provider reports it — labeled as fund-reported, not computed."),

  h2("6.6 Crypto (separate scale — never merged with equity scores)"),
  bullet("Momentum: 12-1 and 6-month returns, distance from all-time high."),
  bullet("Market structure: market-cap rank stability (rank decay is a red flag), volume/market-cap ratio (liquidity), max drawdown depth/recovery."),
  bullet("Dilution: circulating vs max supply and scheduled emissions — the crypto analogue of share dilution."),
  bullet("Explicit non-claim: these are trading/quality signals, not intrinsic-value estimates; the UI labels them as such."),

  h2("6.7 Bonds & rates (regime dial, not per-security scores)"),
  bullet("Yield-curve slope (10y minus 2y, FRED): inversion → caution regime."),
  bullet("Credit spreads (high-yield OAS): widening → risk-off regime."),
  bullet("Real yields (10y TIPS): the discount-rate headwind/tailwind for risk assets."),
  bullet("The regime dial contextualizes equity/crypto scores (e.g. 'risk-off: momentum less reliable') and guides duration choice among bond ETFs; it does not alter factor scores."),

  h2("6.8 Update cadence & determinism"),
  bullet("Prices refresh daily (EOD, free-tier delayed); fundamentals weekly or on-demand; macro series on their release cadence."),
  bullet("Scoring runs after each refresh and is persisted to factor_scores with a runAt timestamp — reruns over the same data give identical results."),

  h2("6.9 What this logic deliberately does NOT do (v1)"),
  bullet("No backtesting engine yet (logged in ENHANCEMENTS; the persisted score history is designed to make it possible)."),
  bullet("No machine learning; no LLM anywhere in the numbers. The Epic E3 narrative layer summarizes news/filings next to the scores and must not alter them."),
  bullet("No portfolio optimization, position sizing, or tax advice."),
  note("Maintenance rule: any change to lib/signals/* lands in the same commit as the update to this section."),

  h1("7. Known Limitations / Open Risks"),
  bullet("yahoo-finance2 is unofficial — endpoints can change without notice. Contained by the provider interface + response cache; upgrade path is FMP/Polygon."),
  bullet("Free-tier data is delayed (typically 15 min to EOD) and analyst-estimate coverage is thin — forward-looking metrics will be missing for many names (handled by the missing-data policy)."),
  bullet("Factor scores describe historical statistical tendencies; they are research aids, not investment advice, and the UI says so."),
  bullet("Single-user design: no auth in the local app; the deployed app must sit behind Vercel protection (F1 decision point)."),
  bullet("Project directory lives in Google Drive sync — node_modules churn; recommend excluding it from sync."),
]);
