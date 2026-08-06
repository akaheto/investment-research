/** Generates PROJECT_PLAN.docx — the living deliverables/status document. */
import { bullet, h1, h2, h3, note, p, table, titlePage, TODAY, writeDoc } from "./helpers.mjs";

const DONE = "✅", WIP = "🟡", TODO = "🔲";

// ── Status data: update these arrays as deliverables move ──────────────
const epicA = [
  ["A1", "Confirm project goal, target users, and must-have features with the user", DONE, "Confirmed 2026-08-03 (see Project Summary)"],
  ["A2", "Recommend and confirm a tech stack based on the goal", DONE, "Next.js 16 + TS + Tailwind, libSQL/Drizzle, Vitest. Confirmed 2026-08-03"],
  ["A3", "Scaffold the project (language/framework, package manager)", DONE, "Next.js 16.3, React 19.2, npm; git repo initialized"],
  ["A4", "Set up a test runner and linter", DONE, "Vitest 4 + ESLint 9; 5 tests passing incl. unhappy paths"],
  ["A5", "Create README.md + CHANGELOG.md (markdown), and TECHNICAL_SPEC.docx, VISUAL_STYLE_GUIDE.docx, USER_GUIDE.docx, ENHANCEMENTS.docx (Word)", DONE, "Generated via scripts/gen-docs (docx-js); render-verified via QuickLook"],
  ["A6", "Baseline check: lint and test commands both run clean on the empty scaffold", DONE, "lint ✓, 5/5 tests ✓, tsc ✓ (2026-08-03); commands in CLAUDE.md Stack notes"],
];

const epicB = [
  ["B1", "Database layer: Drizzle + libSQL, schema v1 (instruments, prices, fundamentals, watchlist), migrations", DONE, "13 tables incl. Epic G; committed SQL migrations; 4 schema tests (2 unhappy paths) — 2026-08-03"],
  ["B2", "Provider interface + equities/ETF connector (yahoo-finance2): quotes + price history", DONE, "EquityProvider contract + registry; offline tests (4 unhappy paths) + live smoke vs real Yahoo — 2026-08-03"],
  ["B3", "Fundamentals ingestion for stocks/ETFs (valuation, growth, quality metrics)", DONE, "FundamentalsProvider + yahoo quoteSummary adapter (P/E, debt/equity, margins); 3 tests"],
  ["B4", "Crypto connector (CoinGecko free tier)", DONE, "CoinGeckoCryptoProvider (batch quotes, market charts); free API, no key needed; 2 tests"],
  ["B5", "Macro/rates connector (FRED): yields, curve, inflation, unemployment", DONE, "FredMacroProvider (series observations, date ranges); FRED_API_KEY required; 2 tests"],
  ["B6", "Refresh pipeline: caching, rate-limit handling, npm run refresh + /api/refresh (Vercel cron ready)", DONE, "Cache layer (provider_cache table), per-provider rate limits (ms delays), cachedFetch() wrapper, /api/refresh endpoint + CRON_SECRET guard, npm run refresh script"],
  ["B7", "Env-driven provider selection/fallback config (free ↔ paid swap without code changes)", DONE, "Registry with fallback lists (EQUITY_PROVIDER='fmp|yahoo' tries FMP then Yahoo); getEquityProvider/getCryptoProvider/getMacroProvider factories; 1 test"],
];

const epicC = [
  ["C1", "App shell: nav, light/dark theme, style-guide tokens wired into Tailwind", DONE, "220px rail, 6 routes, tokens as CSS vars → Tailwind 4 @theme; both themes screenshot-verified in Chrome — 2026-08-03"],
  ["C2", "Watchlist: add/remove instruments, live quote table", DONE, "Server actions for add/remove, real quotes from DB + factor scores (4-factor breakdown) — 2026-08-04"],
  ["C3", "Instrument detail page: price chart, fundamentals panel, score breakdown", DONE, "Real price history, fundamentals fetched from DB, factor percentiles displayed — 2026-08-04"],
  ["C4", "Market overview: indices, yield curve, crypto snapshot", DONE, "Live indices (SPY/QQQ/IWM), FRED yield curve (2Y/5Y/10Y/30Y), crypto (BTC/ETH/USDT) — 2026-08-04"],
  ["C5", "News feed panel with ticker tagging", DONE, "Real headlines with EST timestamps via NewsAPI integration — 2026-08-04"],
];

const epicD = [
  ["D1", "Factor metric computation + normalization library (winsorize → percentile rank), fully unit-tested", DONE, "metrics.ts with winsorization bounds, percentile ranking, confidence assessment — 2026-08-04"],
  ["D2", "Composite scoring with tunable weights + presets (Balanced / Value / Growth / Quality tilts)", DONE, "composer.ts with PRESET_WEIGHTS, automatic preset suggestion based on factor profile — 2026-08-04"],
  ["D3", "Screener UI: filters, ranked results, per-score decomposition drill-down (auditability)", DONE, "Real screener from watchlist, ranked by composite score, sort by any factor — 2026-08-04"],
  ["D4", "Macro regime dial: yield-curve slope, credit spreads, real yields", DONE, "Live regime calculation from FRED data, displayed on Markets page — 2026-08-04"],
];

const epicE = [
  ["E1", "News ingestion (RSS/free feeds) with ticker tagging + dedupe", DONE, "NewsAPI integration in refresh pipeline, fetchNewsForWatchlist() — 2026-08-04"],
  ["E2", "Events calendar: earnings dates, Fed meetings, CPI releases", DONE, "EventsWidget on Markets page; 18 events (12 CPI + 6 FOMC) initialized via admin panel — 2026-08-04"],
  ["E3", "LLM narrative layer (Claude API): summarizes news/filings per holding; explains, never scores", DONE, "Implemented as G5 (event-overlay assessments with Claude Opus) — 2026-08-04"],
];

const epicG = [
  ["G1", "Accounts & holdings: data model (accounts, holdings, plan_menu, proxy_map) + manual entry and CSV import of Transamerica statements/menus", DONE, "Data model in schema; server actions for portfolio overview — 2026-08-04"],
  ["G2", "Proxy mapping + scoring of held funds AND each plan's menu alternatives on the foundational criteria", DONE, "scoring-actions.ts: scoreFundsBySlot, findBetterAlternatives, scoreFundComparative (60% cost + 40% performance) — 2026-08-04"],
  ["G3", "Portfolio dashboard: allocation across both accounts, overlap, cost drag, per-holding scores", DONE, "Portfolio page with account-level data, combined allocation, expense drag — 2026-08-04"],
  ["G4", "Within-menu optimization suggestions with full score decomposition", DONE, "optimization-actions.ts: generateSuggestionsForAccount, getSuggestionsForAccount, refreshSuggestionsForAccount; admin panel wired — 2026-08-04"],
  ["G5", "Event-overlay assessments (Claude API): news (business + political) and calendar events cited with explicit direction of influence; stored with event IDs", DONE, "event-assessment-actions.ts: assessEventImpactForAccount, getLatestAssessmentForAccount; Claude Opus integration complete — 2026-08-04"],
];

const epicF = [
  ["F1", "Vercel deployment: Turso database, env/secrets, cron-driven refresh", DONE, "Live at https://investment-research-weld.vercel.app; 8/8 env vars configured; cron active (3 AM UTC daily) — 2026-08-04"],
  ["Q1", "Unit tests for core logic, including unhappy paths", DONE, "41/43 tests passing (2 skipped); schema, providers, scoring, screener, symbol-search logic covered — 2026-08-05"],
  ["Q2", "Tests for each major feature's CRUD/critical-path logic", DONE, "Watchlist, Portfolio, Fund Scoring, Optimization, Events, Assessments all unit-tested — 2026-08-04"],
  ["Q3", "Manual QA pass against this plan before calling v1 done", DONE, "In-app click-through found no crashes 2026-08-04, but did not catch that prices/factor scores were silently never persisted, DB env misconfiguration, or two pages permanently broken by a Next.js 16 API change — see Q4. Superseded by Q4 as the real pre-ship gate."],
  ["Q4", "Full production audit: every page/feature exercised against the live deployment, not local/dev, with real evidence (curl status codes, runtime logs, DB reads) — not screenshots alone", DONE, "Found and fixed 3 production-breaking infra bugs (wrong DB env var name → every query silently failing; Turso had zero applied migrations; 2 migration files used non-portable multi-statement SQL) plus 11 further issues on re-audit: prices/factorScores computed but never written (Screener/Watchlist could never show real data); deprecated Claude model (EOL the next day); G5 narrative assessments generated via a real paid API call but never displayed; /instrument/[symbol] and /portfolio/[accountId] permanently broken (Next.js 16 requires unwrapping params as a Promise); Portfolio page hardcoded to accounts[0] with no way to reach the second account; Dashboard was a static stub ignoring real data; asset allocation was hardcoded regardless of actual holdings. All fixed and re-verified in production — 2026-08-05. CLAUDE.md updated: production verification is now a required step for any bug fix, not local/dev alone."],
];

const epicH = [
  ["H1", "Off-canvas nav drawer + 48px top app bar for <1024px viewports (hamburger, wordmark, theme toggle)", TODO, "Root-cause fix for the permanently-docked 220px sidebar eating ~55% of a phone viewport. New components/mobile-nav-bar.tsx, components/nav-drawer.tsx, components/nav-icons.tsx (icons extracted from sidebar.tsx, shared not duplicated). Full spec: MOBILE_AND_UX_ENHANCEMENT_PLAN.md Part 1. Est. 6-8h."],
  ["H2", "Hide desktop rail below lg; wire drawer into app/layout.tsx; reduce page gutters to 16px below lg", TODO, "components/sidebar.tsx gets `hidden lg:flex`; app/layout.tsx padding becomes px-4 py-4 lg:px-6 lg:py-6. Plan §1.3-1.4. Est. included in H1."],
  ["H3", "Responsive polish: Markets stat-block stacking, table scroll-affordance fade, 44px touch targets on mobile-reachable controls", TODO, "app/markets/page.tsx grid-cols-1 sm:grid-cols-3 on the macro-regime stat row; trailing-edge mask-image fade on Watchlist/Screener table wrappers; components/button.tsx gains a touch-size variant. Plan §2. Est. 3-4h."],
  ["H4 (optional)", "Desktop/tablet icon-only collapsed rail with localStorage-persisted preference", TODO, "Closes the gap on the pre-existing (previously inaccurate) VISUAL_STYLE_GUIDE §7.2 'collapsible to icons' claim. Not required to fix the mobile bug (H1-H3 already do that) — nice-to-have. Plan §1.5. Est. 2h."],
];

const epicI = [
  ["I1", "Watchlist notes & target-price inline editor", TODO, "watchlist.note / targetPrice columns exist but have no UI. New server actions + components/watchlist-note-editor.tsx. Plan §4.1. Est. 3h."],
  ["I2", "Dashboard refresh-status badge (\"Last updated 2h ago\")", TODO, "getLastRefreshSummary() reuses existing auditEvents queries. Plan §4.2. Est. 2h."],
  ["I3", "Dashboard sector-composition donut chart", TODO, "getSectorBreakdown() groups watchlist by instruments.sector; components/sector-donut.tsx reuses the validated Recharts + categorical-palette pattern from the instrument page. Plan §4.3. Est. 4h."],
  ["I4", "Screener column customization (show/hide metric columns, localStorage-persisted)", TODO, "components/column-picker.tsx; no DB change — single-user local app, localStorage is sufficient for v1. Plan §4.4. Est. 5h."],
  ["I5", "Watchlist collections/folders", TODO, "Only item in this epic requiring a schema change: new collections table + watchlist.collectionId FK. Must verify migration statement-breakpoint markers before Turso apply (see Epic F/Q4 lesson). Plan §4.5. Est. 6h."],
  ["I6", "Instrument detail scorecard reorder (composite + 4 factors above the fold on mobile)", TODO, "Primarily a JSX reorder, not new data — factor_scores already fetched on this page. Plan §4.6. Est. 6h."],
  ["I7", "News page redesign: sector tabs, Your Holdings/Trending sections, search, sentiment badges", TODO, "Full standalone spec: NEWS_PAGE_REDESIGN.md (delivered 2026-08-06). Mobile addendum (scrollable tab bar) folded in via Plan §4.7. Est. 23h — largest item in this epic."],
];

const changelog = [
  ["[init]", "Project plan created from starter template. No code written yet."],
  ["2026-08-03", "A1/A2: goal + stack confirmed (free-tier data behind provider abstraction, Vercel-deployable, rules-based signals + LLM narrative later). Epics B–F defined."],
  ["2026-08-03", "A3: Next.js 16 + TS + Tailwind scaffolded at repo root; git initialized. Incident: scaffold move overwrote CLAUDE.md; restored — see Lessons Learned."],
  ["2026-08-03", "A4: Vitest + null-safe display formatters; 5 tests passing (incl. unhappy paths); lint clean."],
  ["2026-08-03", "A5: doc set generated via scripts/gen-docs (docx-js): this plan, TECHNICAL_SPEC, VISUAL_STYLE_GUIDE, USER_GUIDE, ENHANCEMENTS + README/CHANGELOG. Table-width rendering bug caught by QuickLook verification and fixed (pct → DXA)."],
  ["2026-08-03", "A6: baseline clean — lint, 5/5 tests, typecheck. Epic A complete."],
  ["2026-08-03", "Scope addition (user): Epic G — portfolio assessment & optimization for two Transamerica Retirement accounts, with news/political-event influence explicitly called out in assessments. Holdings via manual entry + CSV (user decision). E3 narrative layer folded into G5."],
  ["2026-08-03", "B1: Drizzle + libSQL database layer — schema v1 (13 tables incl. Epic G), committed SQL migrations, env-driven client (file:local.db ↔ Turso), migration runner, schema tests green (9/9 suite)."],
  ["2026-08-03", "B2: EquityProvider contract + env-driven registry + yahoo-finance2 v4 connector (batch quotes, daily history). Offline suite 17/17; SMOKE=1 live smoke verified against real Yahoo. changePercent normalized to ratio."],
  ["2026-08-03", "B3-B7: Fundamentals (yahoo quoteSummary), crypto (CoinGecko free), macro (FRED), refresh pipeline with TTL cache + per-provider rate limits, provider registry with fallback lists. npm run refresh + /api/refresh (CRON_SECRET). Epic B complete. (Correction: lint had 3 errors at commit time, caught and fixed in C1 — see Lessons Learned.)"],
  ["2026-08-03", "C1: App shell — style-guide tokens as CSS vars wired into Tailwind 4 @theme, next-themes light/dark (class strategy), 220px left rail with active accent bar, 6 routes with empty states, persistent not-advice footer. Build clean, all routes 200, both themes screenshot-verified in Chrome. Fixed B3-B7 lint debt."],
  ["2026-08-04", "Epic C (C2-C5): Watchlist page with real quote data + factor scores; Instrument detail with price history/fundamentals; Markets page with live indices/yields/crypto; News with EST timestamps."],
  ["2026-08-04", "Epic D (D1-D4): Factor scoring library (metrics.ts: winsorization, percentile rank, confidence); Composite scorer (composer.ts: tunable weights, presets). Screener UI ranked by composite score. Macro regime dial from FRED data."],
  ["2026-08-04", "Epic B (continued): EST timezone formatting on all timestamps (formatTimeEST utility). TTL-based provider caching (15min quotes, 24h fundamentals, 1h macro, 4h technicals). Admin Analytics page shows cache stats. Seed Mag 7 automatic on first load."],
  ["2026-08-04", "Epic F (partial): Vercel deployment complete with Turso database, all env vars configured, migrations run, 9 production pages verified. Cron job scheduled daily at 3:00 AM UTC."],
  ["2026-08-04", "Epic G (G1-G5) COMPLETE: Portfolio data model (schema); Fund scoring (60% cost + 40% performance); Optimization suggestions engine with 5 suggestions totaling $108,767 annual savings; Portfolio overview, holdings table, optimization summary UI; Event impact assessments via Claude Opus. Admin panel wired for one-click generation."],
  ["2026-08-04", "Epic E2 COMPLETE: EventsWidget restored to Markets page; economic calendar initialized with 18 events (12 CPI releases monthly, 6 FOMC meetings 2026-2027)."],
  ["2026-08-04", "Epic F COMPLETE: Vercel deployment live (https://investment-research-weld.vercel.app); Turso database connected; 8/8 environment variables configured; cron job active (daily 3 AM UTC refresh)."],
  ["2026-08-04", "Epic Q (QA & Hardening) COMPLETE: 35/37 tests passing; lint 0 errors/0 warnings; TypeScript clean; all 14 pages verified in production; Turso DB stable; no crashes or errors. v1.0 SHIP READY."],
  ["2026-08-05", "Correction to the 2026-08-04 Epic G entry: the '$108,767 annual savings' figure was inflated ~100x by a since-fixed calculation bug (erDifference used as a whole percent instead of divided by 100). The real figure for the two live accounts is ~$1,088/yr."],
  ["2026-08-05", "CRITICAL: despite Q3's 2026-08-04 sign-off, production was actually broken end-to-end. Root causes, found via real production evidence (curl, runtime logs) rather than trusting the UI: (1) db/client.ts only read TURSO_DATABASE_URL, but Vercel had DATABASE_URL configured — every production DB call silently fell back to an unwritable local file; (2) once reachable, Turso had zero applied migrations (schema never existed there); (3) two migration files used multi-statement SQL without the drizzle-kit breakpoint markers, which Turso's remote protocol rejects (local dev's embedded driver had masked this). All three fixed; added an in-app Admin > Apply DB Migrations action since the DB credentials are Vercel 'sensitive' vars unreadable even by the CLI."],
  ["2026-08-05", "Q4: full production audit (see Epic F/Q table) — 11 further issues found and fixed, most notably that prices and factor scores were computed on every refresh but never written to the database, so Screener/Watchlist could never show real data through any button in the app. Also fixed: deprecated Claude model, write-only G5 narrative, permanently-broken instrument/account detail pages (Next.js 16 async params), single-account-only Portfolio page, static Dashboard stub, hardcoded asset allocation. CLAUDE.md now requires production verification (not local/dev) for any bug fix."],
  ["2026-08-05", "Enhancement: watchlist accepts a company name, not just a ticker — addToWatchlist() resolves free text via the equity provider's symbol search and rejects unmatched input, instead of blindly creating an instrument from whatever was typed."],
  ["2026-08-06", "Enhancement: price sparklines added to Watchlist and Screener tables (30-day trend line, green/red by direction). Admin Analytics gained an API Connections status panel (all 8 providers: configured/last-call/status/records) with per-provider drill-down to a 30-day call-history detail page. Full production test pass: 40+ cases, 0 issues found. Enhancement backlog reviewed and expanded (ENHANCEMENTS.docx) — 13 new no-new-connection ideas identified, prioritized by effort/impact."],
  ["2026-08-06", "Planning pass (Opus, per user's model-tiering workflow — see CLAUDE.md): user reported the live mobile view was unusable (4 screenshots supplied). Root cause diagnosed — components/sidebar.tsx's 220px rail has zero responsive treatment and is permanently docked, leaving ~90-110px of usable width on a phone. Two new epics added: Epic H (Mobile Responsive Redesign — off-canvas drawer nav, corrects a VISUAL_STYLE_GUIDE claim that was never actually built) and Epic I (UX Enhancement Backlog — the 7 no-new-connection shortlist items from the priority matrix, now spec'd to build-ready detail). Full plan: MOBILE_AND_UX_ENHANCEMENT_PLAN.md. Per user instruction, implementation is queued for a lighter model; this pass is planning/documentation only — no application code changed."],
];

const statusRow = ([id, d, s, n]) => [id, d, { text: s }, n];

await writeDoc("PROJECT_PLAN.docx", [
  ...titlePage("Project Plan — Investment Research Dashboard", `Status legend: ${TODO} Not Started · ${WIP} In Progress · ${DONE} Done · ⛔ Blocked`, TODAY),

  h1("1. Project Summary"),
  p("A personal investment-research dashboard for one user (Ben) that stays current automatically. It aggregates prices, fundamentals, macro data, and news for stocks, ETFs, crypto, and bonds through API connectors, and surfaces good investment candidates through transparent, rules-based factor scoring. Success looks like: open the dashboard, see up-to-date data and ranked candidates with auditable reasoning, with no manual data wrangling."),
  bullet([{ text: "Data strategy: ", bold: true }, { text: "free-tier providers (Yahoo via yahoo-finance2, CoinGecko, FRED, SEC EDGAR/RSS) behind a provider-agnostic connector layer, so paid providers can be swapped in via config later." }]),
  bullet([{ text: "Deployment: ", bold: true }, { text: "local-first on macOS; designed for Vercel deployment (libSQL/Turso storage, cron-driven refresh)." }]),
  bullet([{ text: "Signals: ", bold: true }, { text: "deterministic factor scoring (valuation / growth / quality / momentum) — detailed in TECHNICAL_SPEC § Signal Logic, kept current per user instruction. An LLM narrative layer (Epic E3) explains; it never produces the numbers." }]),
  bullet([{ text: "Asset-class phasing: ", bold: true }, { text: "stocks/ETFs → crypto → bonds. v1 bond coverage is Treasury yields/curves + bond-ETF proxies, not individual CUSIPs." }]),

  h2("1a. Document Formats"),
  p("This plan, TECHNICAL_SPEC, VISUAL_STYLE_GUIDE, USER_GUIDE, and ENHANCEMENTS are Word (.docx), generated by scripts/gen-docs (docx-js) — edit the generator, not the file. README.md and CHANGELOG.md stay markdown (repo-facing)."),
  h2("1b. Model Tiering"),
  p("Foundation work (this plan, style guide, stack, data model, signal-logic design) runs on the strongest available model (Fable). Routine feature implementation in later epics can move to a lighter model, following TECHNICAL_SPEC.docx and VISUAL_STYLE_GUIDE.docx. See CLAUDE.md."),

  h1("2. Working Agreement"),
  bullet("One deliverable at a time: built → self-verified (tests/app/output actually run) → documented → status updated here → next."),
  bullet("Documentation updates happen immediately after each deliverable, never batched."),
  bullet("Enhancement ideas get logged in ENHANCEMENTS.docx the moment they come up."),
  bullet("Material assumptions (scope, data model, security, cost) are confirmed before proceeding; mistakes go to CLAUDE.md Lessons Learned as they happen."),

  h1("3. Deliverables"),
  h3("Epic A — Project Foundation"),
  table(["#", "Deliverable", "Status", "Notes"], epicA.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic B — Data Layer & Connectors"),
  table(["#", "Deliverable", "Status", "Notes"], epicB.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic C — Dashboard UI"),
  table(["#", "Deliverable", "Status", "Notes"], epicC.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic D — Signal Engine"),
  table(["#", "Deliverable", "Status", "Notes"], epicD.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic E — News, Events & Narrative"),
  table(["#", "Deliverable", "Status", "Notes"], epicE.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic G — Portfolio Assessment & Optimization (Transamerica accounts)"),
  table(["#", "Deliverable", "Status", "Notes"], epicG.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic F — Deployment, QA & Hardening (runs last)"),
  table(["#", "Deliverable", "Status", "Notes"], epicF.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic H — Mobile Responsive Redesign"),
  p("Planned 2026-08-06 in response to user-reported unusable mobile view (screenshots). Full spec: MOBILE_AND_UX_ENHANCEMENT_PLAN.md. Queued for a lighter model per the project's model-tiering convention — the architecture decision is made; execution is routine."),
  table(["#", "Deliverable", "Status", "Notes"], epicH.map(statusRow), { widths: [6, 54, 8, 32] }),
  h3("Epic I — UX Enhancement Backlog (no new external connections)"),
  p("The 'no-new-connection shortlist' from the 2026-08-06 enhancement review, spec'd to build-ready detail in MOBILE_AND_UX_ENHANCEMENT_PLAN.md §4. Independently shippable — order in that document is a recommendation, not a dependency chain (except I7, which is large enough to plan as its own block using the standalone NEWS_PAGE_REDESIGN.md)."),
  table(["#", "Deliverable", "Status", "Notes"], epicI.map(statusRow), { widths: [6, 54, 8, 32] }),

  h1("4. Open Questions / Assumptions"),
  bullet("FRED API key: received from user 2026-08-03, stored in .env (gitignored). B5 unblocked."),
  bullet("Transamerica plan fund menus: user will provide each plan's fund lineup (and holdings) via manual entry/CSV when G1 lands."),
  bullet("yahoo-finance2 is an unofficial API: acceptable for personal use; a paid provider (e.g. Financial Modeling Prep) is the upgrade path if it breaks or data quality disappoints."),
  bullet("Project lives in a Google Drive-synced folder; node_modules causes sync churn. Recommendation: exclude node_modules from Drive sync (reversible, user's call)."),

  h1("5. Changelog"),
  table(["Date", "Change"], changelog, { widths: [14, 86] }),
  note("Generated by scripts/gen-docs/project-plan.mjs — do not edit this file directly."),
]);
