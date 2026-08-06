# Changelog

All notable changes to this project. One entry per deliverable.

## [Unreleased]

### 2026-08-06

- **Feature** — Dashboard refresh-status badge (Epic I2)
  New getLastRefreshSummary() action queries auditEvents for latest data_refresh
  timestamp. Dashboard header displays "Last updated 2h ago" + next cron time
  (3:00 AM UTC). Relative time formatter (formatRelativeTime) shows "just now",
  "5m ago", "2h ago", "3d ago", or full date if >7 days.

- **Feature** — Responsive polish: stat stacking, table scroll affordance, touch targets (Epic H3)
  Markets page macro regime stats stack to 1 column below 640px (sm breakpoint).
  Table wrappers (Watchlist, Screener) show trailing-edge fade on mobile to signal
  horizontal scroll. Button component gains size="touch" variant (44px height,
  44×44px touch target minimum per WCAG 2.5.5 and Apple HIG).

- **Feature** — Mobile responsive nav: off-canvas drawer + top app bar (Epic H1–H2)
  New components: components/nav-icons.tsx (shared icon set), mobile-nav-bar.tsx
  (48px header with hamburger + wordmark + theme toggle), nav-drawer.tsx (260px
  off-canvas drawer with 44px touch-target rows). Sidebar hidden below 1024px
  breakpoint, drawer slides in from left over dim backdrop (closes on
  link-click/Escape/backdrop-click, body-scroll-lock while open). Page padding
  reduced to 16px below lg to reclaim space on phones. All 11 nav items
  + active-state indicator (accent bar) carried over from desktop. Test build
  clean: npm run lint OK, 56/58 tests passing (2 pre-existing skips).
  Deployed to https://investment-research-weld.vercel.app.

- **Planning** — Mobile responsive redesign + UX enhancement backlog planned
  (Opus, per the project's model-tiering convention — implementation queued
  for a lighter model). User reported the live mobile view was unusable (4
  screenshots: Screener/Watchlist/Markets/Dashboard). Root-caused:
  `components/sidebar.tsx` renders a fixed 220px rail with zero responsive
  treatment, permanently docked at every viewport width — on a ~390px phone
  this leaves ~90–110px of usable content width, which is the direct cause
  of every visual symptom in the screenshots (text wrapping mid-word, tables
  showing only one column). Also found: `VISUAL_STYLE_GUIDE.docx` §5 already
  claimed the nav was "collapsible to icons" — never actually built; corrected.
  Full build-ready plan written: `MOBILE_AND_UX_ENHANCEMENT_PLAN.md` — Part 1
  (off-canvas drawer + top app bar below 1024px, chosen over an icon-rail or
  bottom-tab-bar after evaluating both), Part 2 (responsive polish: stat-block
  stacking, table scroll-affordance, touch targets), Part 4 (specs for all 7
  "no-new-connection" backlog items: watchlist notes/target-price UI, dashboard
  refresh badge, dashboard sector chart, screener column picker, watchlist
  collections, instrument scorecard reorder, news redesign). Wired into the
  real project docs, not left standalone: `PROJECT_PLAN.docx` gained **Epic H
  — Mobile Responsive Redesign** (H1–H4) and **Epic I — UX Enhancement
  Backlog** (I1–I7), all status Not Started; `VISUAL_STYLE_GUIDE.docx` gained
  new §7 Responsive/Mobile Design (breakpoint contract: <1024px = drawer nav,
  ≥1024px = unchanged desktop rail; 44px touch-target rule; corrected nav
  pattern); `ENHANCEMENTS.docx` backlog entries updated to point at the specs.
  No application code changed in this pass — planning/documentation only.
  Lint clean, 56/58 tests passing (2 skipped, pre-existing).

- **Feature** — Price sparklines: added visual 30-day price trend indicators
  (line charts, color-coded by direction) to Watchlist and Screener tables.
  New `components/sparkline.tsx` client component renders tiny 96x32px
  Recharts LineCharts, shows "—" for insufficient data (<2 points), colors
  green for uptrend, red for downtrend using existing theme tokens. Extended
  watchlist/screener server actions to fetch 30 daily prices per instrument
  instead of 2, reversed and passed to Sparkline. Instrument detail page
  chart unaffected. All 3 stocks render correctly; theme-aware. Tests ✓,
  lint ✓.

- **Feature** — API Connections diagnostic panel: new admin card showing all
  8 external data providers (yahoo, coingecko, fred, finnhub, alphavantage,
  newsapi, ibkr, anthropic) with configured status, last call timestamp,
  success/error indicator, and records returned. New server action
  `getApiConnectionsStatus()` in lib/audit/tracker.ts checks env vars for
  configuration, queries apiCalls table for latest call per provider. New
  component `api-connections-status.tsx` renders table with clickable rows.
  Integrated into admin/analytics page. Production verified: all providers
  showing, status indicators accurate, configured badges correct.

- **Feature** — Drill-down API call history: clicking any provider row in the
  API Connections panel navigates to `/admin/analytics/connections/[provider]`,
  a detail page showing last 30 days of audit-logged calls. New server action
  `getProviderCallHistory(provider, daysBack)` fetches filtered call records
  ordered by timestamp DESC. Detail page displays table: Timestamp, Endpoint,
  Method, Status (color-coded green for 200–299, red else), Duration, Records,
  Error. Empty state shows "No API calls to [provider] in the last 30 days"
  for providers never called. Back link navigates to admin panel. Production
  verified: all 8 providers tested including empty states; no console errors.

- **QA** — Comprehensive production testing (40+ test cases):
  Sparklines rendering correctly (color, data handling, edge cases) ✓
  API Connections panel (all 8 providers, status accuracy, configured state) ✓
  Drill-down detail pages (empty states, data display, navigation) ✓
  No critical/high/medium/low severity issues found. System clean.

### 2026-08-05

- **Fix (critical)** — Production was fully broken despite being signed off
  the previous day. `db/client.ts` only read `TURSO_DATABASE_URL`, but
  Vercel had `DATABASE_URL` configured — every production DB call silently
  fell back to an unwritable local file. Fixed by accepting either name.
  This in turn revealed Turso had zero applied migrations (schema never
  existed there), and that two migration files used multi-statement SQL
  without drizzle-kit's breakpoint markers, which Turso's remote protocol
  rejects (local dev's embedded driver had masked this). All three fixed;
  added an in-app Admin > Apply DB Migrations action since the DB
  credentials are Vercel "sensitive" vars, unreadable even by the CLI.
- **Fix (production audit)** — Full production audit (every page/feature
  exercised against the live deployment with real evidence — curl status
  codes, runtime logs, DB reads — not screenshots alone) found and fixed
  11 further issues: prices and factor scores were computed on every
  refresh but never written to the database, so Screener/Watchlist could
  never show real data through any button in the app; deprecated Claude
  model (`claude-opus-4-1-20250805`, EOL the next day) replaced with
  `claude-sonnet-5`; G5 event-impact narratives were generated via a real
  paid API call but never displayed anywhere — added to both portfolio
  pages; `/instrument/[symbol]` and `/portfolio/[accountId]` were
  permanently broken (Next.js 16 requires unwrapping `params` as a
  Promise; both read it synchronously) — fixed, and `/portfolio/[accountId]`
  rebuilt from 100% hardcoded mock data to real DB queries; Portfolio page
  only ever showed `accounts[0]` with no way to reach the second account —
  added an account switcher; Dashboard was a fully static stub ignoring
  real data — wired to Markets/Watchlist/News; asset allocation
  percentages were hardcoded regardless of actual holdings — now computed
  from each fund's real `assetClassSlot`. CLAUDE.md updated: production
  verification is now a required step for any bug fix, not local/dev
  alone. Tests 41/43 ✓ (2 skipped), build ✓, lint ✓.
- **Enhancement** — Watchlist accepts a company name, not just a ticker.
  `addToWatchlist()` previously took whatever text was typed, uppercased
  it, and created an instrument from that literal string with no
  validation — typing "Tesla" created a fake instrument symbol "TESLA",
  not the real ticker. Now resolves free text via the equity provider's
  symbol search (added `EquityProvider.searchSymbol()`, backed by
  yahoo-finance2's built-in search, which handles both tickers and
  company names identically) before ever touching the database; rejects
  unmatched input with a clear error instead of creating garbage. Added
  `Admin > Delete Instrument`, a cleanup tool (with a can't-delete-if-
  still-watched safety rail) for symbols created before this validation
  existed. 6 new tests (name resolution, exact-match preference, non-
  equity filtering, no-match, blank input, transport failure).
- **Docs** — All five generated documents reconciled against actual
  shipped/verified state: ENHANCEMENTS (4 items moved to Implemented),
  PROJECT_PLAN (corrected an inflated "$108,767 annual savings" figure
  left over from the pre-fix 100x calculation bug; added Q4 audit
  deliverable), TECHNICAL_SPEC (documented the env-var-name, Turso
  migration-breakpoint, and Next.js 16 async-params gotchas found today),
  USER_GUIDE (rewritten from future-tense "what v1 will do" to present-
  tense actual behavior — it had still said "the app runs on your Mac; a
  web version is planned" despite being live on Vercel), VISUAL_STYLE_GUIDE
  (nav list was missing Oracle/Portfolio/Admin; score-badge pattern
  claimed no color-mapping but the shipped component uses a loss-to-gain
  gradient; added the destructive-button pattern).

### 2026-08-04

- **C2-C5** — Watchlist page with real quote data + factor-score display;
  instrument detail page with price history/fundamentals; Markets page
  with live indices/yields/crypto; News page with EST timestamps.
- **D1-D4** — Factor scoring library (`lib/signals/metrics.ts`:
  winsorization, percentile rank, confidence assessment) and composite
  scorer (`lib/scoring/composer.ts`: tunable weights, Balanced/Value/
  Growth/Quality presets). Screener UI ranked by composite score, sortable
  by any factor. Macro regime dial from FRED data on the Markets page.
- **E1-E3** — NewsAPI ingestion wired into the refresh pipeline
  (`fetchNewsForWatchlist()`); events calendar (FOMC meetings, CPI
  releases) on the Markets page; Claude-written event-impact narrative
  (E3, folded into G5).
- **G1-G5** — Portfolio data model (accounts, holdings, plan_menu,
  proxy_map, assessments); fund scoring (60% cost + 40% performance)
  against each plan's menu; portfolio overview/holdings/optimization UI;
  event-impact assessments via the Claude API. Admin panel wired for
  one-click generation of all of the above.
- **F1** — Vercel deployment: Turso database, all env vars configured,
  cron job scheduled daily at 3:00 AM UTC.
- **Q1-Q3** — 35/37 unit tests passing; lint/typecheck clean; an initial
  manual QA pass found no crashes in-app. (Q3's pass turned out to have
  missed several production-only failures — see the 2026-08-05 audit
  entries above, which superseded it as the real pre-ship gate.)

- **B-Cache** — Provider caching layer: `lib/cache/provider-cache.ts`
  implements TTL-based response caching (quotes 15m, fundamentals 24h, macro
  1h, technicals 4h) in SQLite provider_cache table. Wrapped via
  `lib/cache/cached-providers.ts`; transparent to the app with
  DISABLE_CACHE=1 override. Admin analytics now displays cache stats (total
  entries, fresh/stale counts, by-type breakdown). Reduces API call volume
  while maintaining data freshness. Tests 35/35 ✓, build ✓, lint ✓.
- **B-Admin** — Cache management actions in `app/admin/actions.ts`:
  getCacheStatus() and clearStaleCache(); integrated into Admin Analytics
  page alongside API usage and system events monitoring.

### 2026-08-03

- **A1/A2** — Project goal, scope, and stack confirmed: free-tier data
  behind a provider-agnostic layer, Vercel-deployable, deterministic
  factor scoring with LLM narrative deferred to Epic E3. Epics B–F
  defined in PROJECT_PLAN.docx.
- **A3** — Scaffolded Next.js 16.3 + React 19.2 + TypeScript + Tailwind 4
  at repo root (npm); git repository initialized. Incident: scaffold move
  overwrote CLAUDE.md; restored same session (see CLAUDE.md Lessons
  Learned).
- **A4** — Vitest 4 test runner configured with `@/*` alias; null-safe
  display formatters (`lib/format.ts`) with 5 passing tests including
  unhappy paths (null/undefined/NaN → "—"). Lint clean.
- **A5** — Documentation set created, generated via `scripts/gen-docs`
  (docx-js): PROJECT_PLAN (filled summary + real epics), TECHNICAL_SPEC
  (incl. detailed Signal Logic section), VISUAL_STYLE_GUIDE (palette
  validated light+dark with the dataviz six-check validator), USER_GUIDE,
  ENHANCEMENTS; plus this README/CHANGELOG.
- **A6** — Baseline check clean: `npm run lint` ✓, `npm test` 5/5 ✓,
  `tsc --noEmit` ✓. Stack commands recorded in CLAUDE.md. Epic A complete.
- **Scope** — Epic G added: Transamerica portfolio assessment &
  optimization (manual + CSV holdings ingest, within-menu suggestions,
  event-overlay assessments with cited news influence). FRED API key
  received and stored in .env; .env.example added.
- **B1** — Database layer: Drizzle + libSQL schema v1 (13 tables incl.
  Epic G portfolio tables), committed SQL migrations, env-driven client
  (`file:local.db` ↔ Turso), `npm run db:migrate` runner. 4 schema tests
  incl. unhappy paths (duplicate snapshot, NOT NULL); suite 9/9 green.
- **B2** — Provider layer: `EquityProvider` contract (batch quotes, daily
  history, ratio-normalized changePercent), env-driven registry
  (`EQUITY_PROVIDER`, default yahoo), yahoo-finance2 v4 adapter with
  injectable client. Offline tests 17/17 incl. 4 unhappy paths; `SMOKE=1`
  live smoke verified against real Yahoo (AAPL/VTI quotes, 1mo history).
- **B3-B7** — Data providers complete. B3: FundamentalsProvider
  (yahoo adapter, P/E, debt/equity, margins). B4: CoinGeckoCryptoProvider
  (free tier, batch quotes, history). B5: FredMacroProvider (FRED API,
  series observations). B6: Refresh pipeline (caching, per-provider rate
  limits, `npm run refresh` + /api/refresh with CRON_SECRET). B7: Provider
  registry with fallback support (EQUITY_PROVIDER='fmp|yahoo'). Full suite
  24/24 tests, lint clean, typecheck clean. Epic B complete.
- **C1** — App shell: style-guide tokens as CSS custom properties wired
  into Tailwind 4 `@theme`, next-themes light/dark (class strategy, dark
  values re-stepped per guide), 220px left rail with icons + active accent
  bar, 6 routes with calm empty states, persistent not-advice footer.
  Verified: build clean, all routes 200, both themes screenshot-checked
  in Chrome. Also cleared lint debt from B3-B7 (2 `any`s, dead code,
  setState-in-effect) — see CLAUDE.md Lessons Learned.
