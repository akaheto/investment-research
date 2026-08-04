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
