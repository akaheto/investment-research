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
  ["B2", "Provider interface + equities/ETF connector (yahoo-finance2): quotes + price history", TODO, "Provider-agnostic interface is the upgrade path"],
  ["B3", "Fundamentals ingestion for stocks/ETFs (valuation, growth, quality metrics)", TODO, ""],
  ["B4", "Crypto connector (CoinGecko free tier)", TODO, ""],
  ["B5", "Macro/rates connector (FRED): yields, curve, inflation, unemployment", TODO, "Free API key required (user)"],
  ["B6", "Refresh pipeline: caching, rate-limit handling, npm run refresh + /api/refresh (Vercel cron ready)", TODO, "CRON_SECRET guard on the route"],
  ["B7", "Env-driven provider selection/fallback config (free ↔ paid swap without code changes)", TODO, ""],
];

const epicC = [
  ["C1", "App shell: nav, light/dark theme, style-guide tokens wired into Tailwind", TODO, "Per VISUAL_STYLE_GUIDE.docx"],
  ["C2", "Watchlist: add/remove instruments, live quote table", TODO, ""],
  ["C3", "Instrument detail page: price chart, fundamentals panel, score breakdown", TODO, ""],
  ["C4", "Market overview: indices, yield curve, crypto snapshot", TODO, ""],
  ["C5", "News feed panel with ticker tagging", TODO, "Depends on E1"],
];

const epicD = [
  ["D1", "Factor metric computation + normalization library (winsorize → percentile rank), fully unit-tested", TODO, "Spec: TECHNICAL_SPEC § Signal Logic"],
  ["D2", "Composite scoring with tunable weights + presets (Balanced / Value / Growth / Quality tilts)", TODO, ""],
  ["D3", "Screener UI: filters, ranked results, per-score decomposition drill-down (auditability)", TODO, ""],
  ["D4", "Macro regime dial: yield-curve slope, credit spreads, real yields", TODO, ""],
];

const epicE = [
  ["E1", "News ingestion (RSS/free feeds) with ticker tagging + dedupe", TODO, ""],
  ["E2", "Events calendar: earnings dates, Fed meetings, CPI releases", TODO, ""],
  ["E3", "LLM narrative layer (Claude API): summarizes news/filings per holding; explains, never scores", TODO, "Moved to G5 (event-overlay assessments) — kept here as cross-reference"],
];

const epicG = [
  ["G1", "Accounts & holdings: data model (accounts, holdings, plan_menu, proxy_map) + manual entry and CSV import of Transamerica statements/menus", TODO, "User decision 2026-08-03: manual + CSV, no aggregator (cost/credentials/coverage)"],
  ["G2", "Proxy mapping + scoring of held funds AND each plan's menu alternatives on the foundational criteria", TODO, "Proxy-scored funds labeled as such"],
  ["G3", "Portfolio dashboard: allocation across both accounts, overlap, cost drag, per-holding scores", TODO, ""],
  ["G4", "Within-menu optimization suggestions with full score decomposition", TODO, "Respects each plan's fund menu; research aid, not advice"],
  ["G5", "Event-overlay assessments (Claude API): news (business + political) and calendar events cited with explicit direction of influence; stored with event IDs", TODO, "Scores stay deterministic; overlay contextualizes, never alters. Needs ANTHROPIC_API_KEY"],
];

const epicF = [
  ["F1", "Vercel deployment: Turso database, env/secrets, cron-driven refresh", TODO, ""],
  ["Q1", "Unit tests for core logic, including unhappy paths", TODO, "Ongoing per-feature; verified here"],
  ["Q2", "Tests for each major feature's CRUD/critical-path logic", TODO, ""],
  ["Q3", "Manual QA pass against this plan before calling v1 done", TODO, ""],
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

  h1("4. Open Questions / Assumptions"),
  bullet("FRED API key: received from user 2026-08-03, stored in .env (gitignored). B5 unblocked."),
  bullet("Transamerica plan fund menus: user will provide each plan's fund lineup (and holdings) via manual entry/CSV when G1 lands."),
  bullet("yahoo-finance2 is an unofficial API: acceptable for personal use; a paid provider (e.g. Financial Modeling Prep) is the upgrade path if it breaks or data quality disappoints."),
  bullet("Project lives in a Google Drive-synced folder; node_modules causes sync churn. Recommendation: exclude node_modules from Drive sync (reversible, user's call)."),

  h1("5. Changelog"),
  table(["Date", "Change"], changelog, { widths: [14, 86] }),
  note("Generated by scripts/gen-docs/project-plan.mjs — do not edit this file directly."),
]);
