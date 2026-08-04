# Changelog

All notable changes to this project. One entry per deliverable.

## [Unreleased]

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
