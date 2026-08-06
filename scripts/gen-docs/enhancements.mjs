/** Generates ENHANCEMENTS.docx — running idea log, updated as ideas surface. */
import { h1, note, p, table, titlePage, TODAY, writeDoc } from "./helpers.mjs";

await writeDoc("ENHANCEMENTS.docx", [
  ...titlePage("Enhancements Log", "Investment Research Dashboard", TODAY),
  p("Running list of enhancement ideas. Logged the moment they come up (mine or Claude's); moved to Implemented when built."),

  h1("Implemented"),
  table(["Idea", "Date", "Notes"], [
    ["Portfolio assessment & optimization for the user's two Transamerica Retirement accounts", "2026-08-04", "Epic G shipped: holdings + fund menu ingested (manual entry), held funds scored against menu alternatives, within-menu swap suggestions with real annual-savings estimates. Both accounts reachable via an account switcher on /portfolio."],
    ["News/current-events influence in assessments, explicitly called out", "2026-08-04", "Two-layer assessment shipped: deterministic factor scores (Screener/Watchlist) + a Claude-written Event Impact narrative per account (G5), citing upcoming FOMC/CPI events. Displayed on the Portfolio and account-detail pages."],
    ["LLM narrative layer (Claude API) — summarize news/filings per holding", "2026-08-04", "Shipped as the G5 Event Impact Assessment narrative. Explains only; never alters scores. (Was being generated and silently discarded — fixed 2026-08-05 to actually display.)"],
    ["Phone access via Vercel deployment", "2026-08-04", "Live in production on Vercel (Turso DB, daily cron refresh)."],
    ["Watchlist accepts a company name, not just a ticker (\"Tesla\" resolves to TSLA)", "2026-08-04", "addToWatchlist() resolves free text via the equity provider's symbol search before ever writing to the DB; rejects unmatched input instead of creating a fake instrument. Includes a cleanup tool (Admin > Delete Instrument) for garbage symbols created before this existed."],
    ["Price sparklines on Watchlist & Screener", "2026-08-06", "30-day inline trend line per instrument (Recharts, no axes), colored green/red by direction, \"—\" for insufficient history. New components/sparkline.tsx; watchlist/screener actions extended to fetch 30 days instead of 2."],
    ["Admin API Connections status panel", "2026-08-06", "New Admin Analytics card listing all 8 providers (yahoo, coingecko, fred, finnhub, alphavantage, newsapi, ibkr, anthropic) with configured/last-call/status/records-returned. getApiConnectionsStatus() in lib/audit/tracker.ts."],
    ["Per-provider 30-day API call history drill-down", "2026-08-06", "Clicking a provider row opens /admin/analytics/connections/[provider] — full call log (timestamp, endpoint, method, status, duration, records, error). getProviderCallHistory() action; empty-state handled for never-called providers."],
  ], { widths: [40, 14, 46] }),

  h1("Not Yet Implemented — Spec'd & Build-Ready (no new connections)"),
  p("Full build-ready specs for everything in this table: MOBILE_AND_UX_ENHANCEMENT_PLAN.md (Epics H & I in PROJECT_PLAN.docx) and the standalone NEWS_PAGE_REDESIGN.md. Queued for implementation by a lighter model per the project's model-tiering convention — architecture/UX decisions are already made."),
  table(["Idea", "Raised", "Notes"], [
    ["Mobile responsive redesign: off-canvas nav drawer + top app bar (<1024px)", "2026-08-06", "User reported the live mobile view was unusable (220px sidebar permanently docked, ~90-110px of content left on a phone). Root-caused and spec'd: MOBILE_AND_UX_ENHANCEMENT_PLAN.md Part 1 (Epic H1-H2). Est. ~6-8h."],
    ["Mobile responsive polish: stat-block stacking, table scroll fade, 44px touch targets", "2026-08-06", "Secondary symptoms on top of the nav fix above. Plan Part 2 (Epic H3). Est. ~3-4h."],
    ["Desktop/tablet icon-only collapsed nav rail (optional)", "2026-08-06", "Closes the gap on VISUAL_STYLE_GUIDE's pre-existing (previously inaccurate) 'collapsible to icons' claim — corrected in the same pass. Plan §1.5 (Epic H4). Est. ~2h."],
    ["News page redesign (sector tabs, your-holdings section, search, sentiment badges)", "2026-08-06", "Current news page is a flat headline list with no filtering or portfolio context. Full spec: NEWS_PAGE_REDESIGN.md. Uses existing RSS feeds — no new provider. Est. ~23h."],
    ["Watchlist collections/folders", "2026-08-06", "User-defined groupings (e.g. \"Tech plays\", \"Dividend candidates\") so large watchlists stay scannable. New collections table + watchlist.collectionId FK — the one item in this set needing a schema change. Plan §4.5 (Epic I5). Est. ~6h."],
    ["Dashboard sector composition chart", "2026-08-06", "Donut chart of watchlist by sector for an at-a-glance concentration check. Reuses existing Recharts PieChart pattern from the instrument page. Plan §4.3 (Epic I3). Est. ~4h."],
    ["Screener column customization", "2026-08-06", "Let the user toggle which metrics show in the screener table (P/E, FCF yield, debt/equity, etc.), saved to localStorage — single-user local app, no DB table needed for v1. Plan §4.4 (Epic I4). Est. ~5h."],
    ["Watchlist notes & target-price UI expansion", "2026-08-06", "watchlist.note and targetPrice columns already exist in the schema but have no real editing UI. Inline editable note + target price per row. Plan §4.1 (Epic I1). Est. ~3h."],
    ["Dashboard refresh-status badge", "2026-08-06", "\"Last updated: 2 hours ago\" badge sourced from existing audit-event queries. Plan §4.2 (Epic I2). Est. ~2h."],
    ["Instrument detail scorecard (composite + 4 factors, above the fold on mobile)", "2026-08-06", "Reorders existing score data to render before the price chart — primarily a JSX/layout fix, not new data. Plan §4.6 (Epic I6). Est. ~6h."],
  ], { widths: [40, 14, 46] }),

  h1("Not Yet Implemented — Raw Ideas (no new connections, not yet spec'd)"),
  table(["Idea", "Raised", "Notes"], [
    ["Portfolio allocation drift trend line", "2026-08-06", "Chart showing how an account's asset-class mix has drifted from target over time, using historical holdings.asOf snapshots already being recorded. Est. ~6h."],
    ["Settings page: theme, density, refresh schedule", "2026-08-06", "Light/dark/auto theme, compact/normal/spacious table density, basic refresh-cadence config — all client-side or existing-DB, no new integration. Est. ~5h."],
    ["CSV export & shareable filtered links", "2026-08-06", "Export watchlist/screener to CSV; encode screener filters in the URL so a filtered view can be shared/bookmarked. Est. ~7h."],
    ["Backtesting engine over persisted factor-score history", "2026-08-03", "factor_scores table is designed to enable this; consider DuckDB for the analytics if data grows. Factor scores now actually persist (fixed 2026-08-05), so there's real history to backtest against going forward. Simple version (\"buy top-5 scorers weekly, track P&L vs SPY\") est. ~15h."],
    ["WCAG 2.1 AA accessibility audit", "2026-08-06", "Run axe/WAVE across all pages, fix contrast, add ARIA labels, verify full keyboard navigation beyond the touch-target work in the mobile redesign. Est. ~10h."],
    ["Market indices/crypto data on the Markets & Dashboard pages (SPY/QQQ/IWM/BTC/ETH/USDT)", "2026-08-05", "Pipeline now persists prices for whatever's on the watchlist, but these specific index/crypto instruments are never seeded, so the cards stay correctly empty. Needs a seed step (Admin action) to populate them."],
  ], { widths: [40, 14, 46] }),

  h1("Not Yet Implemented — Requires New External Connection/Cost"),
  table(["Idea", "Raised", "Notes"], [
    ["Aggregator sync for account holdings (Plaid / SnapTrade)", "2026-08-03", "Deferred alternative to manual entry: cost, third-party credential sharing, and spotty Transamerica retirement coverage. Revisit if manual updates become a chore."],
    ["Paid data provider upgrade (FMP / Polygon / Tiingo)", "2026-08-03", "Planned-for by design: env-driven provider selection (B7). Trigger: yahoo-finance2 breakage or need for deeper fundamentals/real-time."],
    ["Individual bond data (CUSIP-level)", "2026-08-03", "Deferred — requires premium data; v1 uses yield curve + bond-ETF proxies."],
    ["Real-time quotes", "2026-08-03", "Requires paid provider; free tier is delayed/EOD."],
    ["Portfolio tracking (positions, cost basis, P&L)", "2026-08-03", "Out of v1 scope — dashboard is research-first; natural v2 candidate. Cost-basis tracking needs an imported-transactions source."],
    ["Daily email digest", "2026-08-06", "\"Top 3 headlines + portfolio changes\" opt-in email. Requires SMTP/email-provider integration (e.g. Resend, SES)."],
    ["Sentiment-scoring API for news", "2026-08-06", "Heuristic sentiment badges can ship with no new connection; a materially more accurate sentiment model would require a paid NLP/sentiment API."],
  ], { widths: [40, 14, 46] }),

  h1("Rejected / Deferred"),
  table(["Idea", "Date", "Why"], [
    ["LLM-driven scoring (LLM forms the investment view)", "2026-08-03", "Rejected for v1: not auditable or backtestable; LLMs can be confidently wrong about numbers. Deterministic rules + LLM narrative chosen instead."],
    ["better-sqlite3 file database", "2026-08-03", "Rejected: incompatible with Vercel's ephemeral filesystem. libSQL/Turso chosen — same semantics, deployable."],
  ], { widths: [40, 14, 46] }),
  note("Generated by scripts/gen-docs/enhancements.mjs."),
]);
