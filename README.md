# Investment Research Dashboard

A personal, single-user investment-research dashboard: automatically
refreshed prices, fundamentals, macro data, and news for stocks, ETFs,
crypto, and bonds — plus transparent, rules-based factor scoring
(valuation / growth / quality / momentum) to surface candidates worth a
closer look. Research aid, not investment advice.

**Live:** https://investment-research-weld.vercel.app

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind 4
- **libSQL + Drizzle** — SQLite file locally, Turso on Vercel
- **Free-tier data** behind a provider-agnostic connector layer
  (yahoo-finance2, CoinGecko, FRED, RSS/EDGAR); paid providers swap in
  via env config
- **Vitest** + **ESLint**

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the test suite (Vitest) |
| `npm run lint` | Lint (ESLint) |
| `npm run gen:docs` | Regenerate all .docx project documents |
| `npm run build` | Production build |

## Documentation

Project docs are **generated** Word files — edit the module in
`scripts/gen-docs/`, run `npm run gen:docs`, never hand-edit the .docx:

- `PROJECT_PLAN.docx` — deliverables, statuses, changelog (living doc)
- `TECHNICAL_SPEC.docx` — architecture, data model, **detailed signal
  logic** (kept current with the scoring code, by rule)
- `VISUAL_STYLE_GUIDE.docx` — validated palette, typography, components
- `USER_GUIDE.docx` — non-technical guide
- `ENHANCEMENTS.docx` — idea log (implemented / pending / rejected)

Dev-facing docs stay in the repo: this README, `CHANGELOG.md`, and
`CLAUDE.md` (working agreement + lessons learned).

## Project conventions

- One deliverable at a time; self-verified before "done"; docs updated
  immediately, not batched — see `CLAUDE.md`.
- Every feature ships with tests, including at least one unhappy path.
- Scoring stays deterministic and auditable; the LLM layer (later)
  explains but never produces the numbers.
