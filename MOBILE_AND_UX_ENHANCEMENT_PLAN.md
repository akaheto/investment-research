# Mobile Responsive Redesign + UX Enhancement Plan
**Investment Research Dashboard** · Planned by Opus 2026-08-06 · **For build in a lighter model**

This is a build-ready plan, not a discussion doc. Each section below names exact files, exact component boundaries, exact data-model deltas, and a step order. A lighter model should be able to execute each section independently without re-deriving architecture decisions.

**Scope note:** every item in this plan uses data/infrastructure the app already has. Nothing here requires a new API key, new provider, or paid service.

---

## PART 0 — DIAGNOSIS (why mobile is broken today)

Confirmed by reading the code + 4 phone screenshots the user supplied (Screener, Watchlist, Markets, Dashboard, all in Safari's in-app browser at ~390–430px viewport width):

1. **`components/sidebar.tsx`** renders `<aside className="w-[220px] shrink-0 ...">` — a **fixed-width, always-visible** 220px rail. There is no media query, no breakpoint class, no collapse logic anywhere in the component. It is permanently docked on every screen size, including phones.
2. **`app/layout.tsx`** wraps content in `<div className="flex min-h-screen"><Sidebar />...</div>` — flex row, so on a 390px-wide phone the sidebar alone claims 220px (56% of viewport), leaving ~170px for the entire app, minus `px-6` (24px × 2 = 48px) page padding, minus card padding (16px × 2) — **effective content width in the screenshots is roughly 90–110px.** That is the entire root cause of every visual symptom in the screenshots: "Credit Spreads" breaking mid-word, "MACRO REGIME" wrapping to two lines, the Screener table showing only the Symbol column.
3. **`VISUAL_STYLE_GUIDE.docx §5`** already *claims* "Nav: Left rail 220px (**collapsible to icons**)" — this was never built. The doc overstated a feature that doesn't exist. This plan finally builds it and corrects the doc to match reality (§3 below).
4. Card/table components (`app/watchlist/page.tsx`, `app/screener/page.tsx`) already use `overflow-x-auto` on their table wrappers, and dashboard/markets card grids already use `col-span-12 lg:col-span-N` (i.e., they already stack to full width below `lg`). **These two facts matter**: the grid-stacking and horizontal-scroll mechanics are already correct — the only structural defect is the sidebar eating the viewport. Fixing the sidebar alone will resolve most of the visual breakage in the screenshots. The remaining items below are polish on top of that fix (touch targets, scroll affordance, stat-block wrapping).
5. Nav link touch targets are `h-8` (32px) — below the ~44px minimum recommended mobile tap target (Apple HIG / WCAG 2.5.5).
6. Zero custom Tailwind breakpoints are configured; the app uses Tailwind's stock breakpoints (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280px) inconsistently (22 responsive-class usages total, concentrated in a few pages, none in the shell itself). This plan standardizes which breakpoint means what (§2).

---

## PART 1 — MOBILE NAVIGATION ARCHITECTURE

### Decision: off-canvas drawer + slim top app bar (mobile/tablet), unchanged rail (desktop)

Three patterns were considered:

| Pattern | Verdict | Why |
|---|---|---|
| **A. Off-canvas drawer + hamburger top bar** | ✅ **Chosen** | Reuses the existing `Sidebar` component almost unchanged (same list, same active-state logic) — just repositioned as an overlay instead of docked. Standard, well-understood, cheap to build, cheap for a lighter model to get right. |
| B. Icon-only collapsed rail (persistent, no drawer) | Secondary/optional, desktop+tablet only | Good for reclaiming space on iPad/tablet widths (768–1023px) without hiding nav entirely — see §1.4 as an *optional* enhancement, not required for the phone fix. On a 375–430px phone, even a 56–64px icon rail is 13–17% of the viewport for zero content gain over a drawer, so it's the wrong default for phones. |
| C. Bottom tab bar (native-app style) | ❌ Rejected | 11 nav items (Dashboard, Watchlist, Screener, Markets, News, Research, Oracle, Portfolio, Launchpad, Settings, Admin) is too many for a tab bar (max ~5 before you need a "More" overflow anyway, which just re-creates the drawer one layer deeper). Bigger rebuild for no real benefit over A. |

**Chosen architecture, by breakpoint:**

| Breakpoint | Width | Nav behavior |
|---|---|---|
| `< md` (phone) | 0–767px | Sidebar hidden by default. Top app bar (48px tall) with hamburger icon (left), page title (center/left), theme toggle (right). Tapping hamburger slides the drawer in from the left over a dim backdrop; tapping the backdrop or a nav link closes it. |
| `md`–`lg` (tablet / iPad portrait) | 768–1023px | Same drawer pattern as phone (safest default — iPad in portrait is still narrow enough that a permanent 220px rail is a bad tradeoff). Top app bar shown. |
| `≥ lg` (desktop / iPad landscape+) | 1024px+ | Unchanged: persistent 220px rail, exactly as today. No top app bar (not needed — rail has the branding block already). |

This means the **only** new breakpoint distinction the shell needs is `lg` (1024px) — matching what dashboard/markets card grids already use, so the whole shell now agrees on one mental model: "`lg` is where desktop layout begins."

### 1.1 New component: `components/mobile-nav-bar.tsx`

Client component. Renders only below `lg` (`className="flex lg:hidden ..."`). Contents:
- Hamburger button (44×44px tap target, `aria-label="Open navigation"`, `aria-expanded`, toggles drawer open state)
- App title (reuse "Investment Research" wordmark, smaller — 16px/600)
- `ThemeToggle` (already exists, reuse as-is)

State: drawer open/closed lives in this component (or a shared context — see 1.3) via `useState`.

```tsx
"use client";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { NavDrawer } from "./nav-drawer";

export function MobileNavBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-hairline bg-surface px-3 lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center -ml-1"
        >
          {/* hamburger icon, 20px, 3 bars */}
        </button>
        <span className="text-sm font-semibold text-ink">Investment Research</span>
        <ThemeToggle compact />
      </header>
      <NavDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

### 1.2 New component: `components/nav-drawer.tsx`

Client component. Renders the **same** `NAV_ITEMS` list and `isActive()` helper already in `lib/nav.ts` — do not duplicate the nav model, import it.

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, NAV_ITEMS } from "@/lib/nav";
import { navIcons } from "./nav-icons"; // see 1.5 — icons extracted from sidebar.tsx

export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-hairline bg-surface transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div>
            <div className="text-sm font-semibold text-ink">Investment Research</div>
            <div className="mt-0.5 text-xs text-muted">personal research desk</div>
          </div>
          <button type="button" aria-label="Close navigation" onClick={onClose} className="h-11 w-11">
            {/* X icon */}
          </button>
        </div>
        <nav className="flex-1 px-2" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`relative mb-0.5 flex h-11 items-center gap-2.5 rounded-md px-3 ${
                  active ? "font-medium text-accent" : "text-ink-2"
                }`}
              >
                {active && <span aria-hidden className="absolute left-0 top-2 h-6 w-0.5 rounded-full bg-accent" />}
                <span aria-hidden className={active ? "text-accent" : "text-muted"}>{navIcons[item.label]}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
```

Note the row height is `h-11` (44px) here vs. `h-8` (32px) in the desktop rail — **mobile touch targets get the full 44px**, desktop rows stay compact at 32px. This is an intentional, documented split (§3 style guide update).

Escape-key-closes and body-scroll-lock while open are both cheap adds — include them (`useEffect` with a `keydown` listener; `document.body.style.overflow = open ? "hidden" : ""`).

### 1.3 Wiring into `app/layout.tsx`

```tsx
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />              {/* now: hidden below lg, see 1.4 */}
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNavBar />       {/* new: hidden at/above lg */}
              <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 lg:px-6 lg:py-6">{children}</main>
              <footer className="border-t border-hairline px-4 py-3 text-xs text-muted lg:px-6">
                Research aid, not investment advice. Data may be delayed; free-tier sources.
              </footer>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Two changes beyond adding `<MobileNavBar />`: page padding drops from a flat `px-6 py-6` to `px-4 py-4 lg:px-6 lg:py-6` — reclaims 16px of horizontal space on phones where every pixel matters; footer padding matches.

### 1.4 Change to `components/sidebar.tsx`

Single-line change: add `hidden lg:flex` to the `<aside>` className (replacing the current `flex`). Everything else in the file — the icons object, the nav rendering, the active-state bar — is untouched and correct as-is for desktop.

```diff
- <aside className="flex w-[220px] shrink-0 flex-col border-r border-hairline bg-surface">
+ <aside className="hidden w-[220px] shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
```

**Extract the `icons` object** out of `sidebar.tsx` into `components/nav-icons.tsx` (exported as `navIcons`) so both `Sidebar` and `NavDrawer` import the same icon set instead of duplicating 11 inline SVGs. This is the one mandatory refactor in this section — skipping it means two copies of the same icons to keep in sync forever.

### 1.5 Optional / secondary: icon-only collapsed rail for desktop+tablet

Not required to fix the phone bug (§1.1–1.4 already does that). Listed because the user explicitly asked to "consider an easily collapsible left navigation pane as a possible option," and because the style guide already (incorrectly) promised it.

**If built:** add a collapse toggle button at the bottom of the desktop `Sidebar` (near `ThemeToggle`). Collapsed state = 56px wide, icons only, label shown as a `title` tooltip on hover. Persist the collapsed/expanded preference in `localStorage` (`nav_collapsed: "true"|"false"`), read on mount via `useEffect` (avoid SSR/CSR mismatch — default to expanded on first paint, then apply stored preference). This is a ~2 hour add on top of the drawer work and can ship in the same PR or a fast-follow — **treat as P2, not blocking**.

### 1.6 Build order for Part 1

1. Extract `nav-icons.tsx` from `sidebar.tsx` (no visual change yet — verify desktop nav still renders identically).
2. Build `nav-drawer.tsx` (renders correctly when force-opened via a temporary `open={true}` — verify visually before wiring the toggle).
3. Build `mobile-nav-bar.tsx`, wire the open/close state to `NavDrawer`.
4. Add `hidden lg:flex` to `sidebar.tsx`.
5. Wire `<MobileNavBar />` into `app/layout.tsx`, adjust padding.
6. Manual test at 375px, 390px, 768px, 1024px, 1440px viewport widths (Chrome DevTools device toolbar is sufficient — no real device required, though a real-phone check before calling it done matches the project's QA convention).
7. Keyboard test: Tab should never land on a `aria-hidden` drawer link when closed; Escape closes; focus returns to the hamburger button on close.

**Estimate: 6–8 hours** (drawer + top bar + wiring + testing). Optional collapsed rail (§1.5): +2 hours.

---

## PART 2 — RESPONSIVE POLISH (component-level, on top of Part 1)

These fix the *secondary* symptoms visible in the screenshots that Part 1 alone won't fully resolve (they'd still look cramped at 375px even with full width available, because the components themselves don't have mobile-specific rules).

### 2.1 Markets page macro-regime stat block (`app/markets/page.tsx`)

The 3-column stat row (Yield Curve / Credit Spreads / Real 10Y Yield) currently has no responsive class — it's a fixed-width flex/grid row that wraps labels mid-word once cramped. Fix: `grid grid-cols-1 gap-3 sm:grid-cols-3` — stacks to one stat per row below `sm` (640px), matching how the values already read fine once the sidebar bug is fixed but still benefits from more breathing room on the smallest phones (SE-class, 375px).

### 2.2 Table → mobile scroll affordance (`app/watchlist/page.tsx`, `app/screener/page.tsx`)

`overflow-x-auto` already works mechanically but gives no visual hint that more columns exist off-screen. Add a fading edge gradient on the right side of the table container when it's scrollable, using a small client-side scroll-position check, OR the simpler CSS-only approach: a `background: linear-gradient(...)` mask on the wrapper that only shows when `scrollWidth > clientWidth`. **Recommended simple version (no JS):** add `[mask-image:linear-gradient(to_right,black_92%,transparent)]` to the table wrapper unconditionally below `lg` — cheap, no state, good enough signal. Full scroll-shadow-on-scroll-position is a nice-to-have, not required.

### 2.3 Touch targets on existing buttons

Audit `components/button.tsx` (style guide currently specs 32px height for all buttons). **Add a `size="touch"` variant** (44px height) and apply it specifically to primary actions on pages likely to be used on mobile: Watchlist "Add" button, Screener sort dropdown, Admin action buttons. Leave dense table-row buttons (e.g., the `✕` remove-from-watchlist icon button) as an explicit exception — call out in the style guide that icon-only row actions inside dense tables are allowed to stay at 32px because they sit inside `overflow-x-auto` rows where 44px rows would break table density; the row itself remains tappable via its parent link where applicable.

### 2.4 Card grid gutter tightening on phones

Card-grid `gap-4` (16px) is fine; no change needed — confirmed already responsive via existing `col-span-12 lg:col-span-N` pattern (Part 0, finding 4). No action item here beyond the page-level padding fix already in §1.3.

**Estimate: 3–4 hours** (2.1 + 2.2 + 2.3; 2.4 is a no-op).

---

## PART 3 — VISUAL_STYLE_GUIDE.docx UPDATES

New **§7 Responsive / Mobile** section to add (content below is what actually gets written into `scripts/gen-docs/style-guide.mjs` — see §7 of this plan for the exact generator diff):

- **Breakpoint contract:** `< 1024px (lg)` = mobile/tablet nav mode (drawer); `≥ 1024px` = desktop nav mode (persistent rail). This is the only breakpoint the shell itself cares about; individual pages may use `sm`/`md` for internal stacking (as Markets' stat block will, §2.1).
- **Nav pattern, corrected:** replace the current (inaccurate) "Left rail 220px (collapsible to icons)" line with two lines — one for desktop (unchanged rail, optional icon-collapse — mark as implemented once §1.5 ships, not before) and one for mobile/tablet (off-canvas drawer + 48px top app bar, hamburger + title + theme toggle).
- **Touch targets:** interactive elements reachable on `< lg` viewports must be ≥44×44px (nav drawer rows, hamburger, primary buttons). Desktop-only dense controls (32px table row buttons, desktop nav rows) are exempt — call this the split explicitly so no future contributor "fixes" desktop density by accident.
- **Page gutters by breakpoint:** 16px (`px-4`) below `lg`, 24px (`px-6`) at `lg`+ — matches §1.3.
- **Table pattern on mobile:** horizontal scroll (`overflow-x-auto`) is intentional and expected on narrow viewports; wrapper should signal scrollability via the trailing-edge mask (§2.2). Do not attempt to force full table content to reflow into cards for v1 — scroll is the accepted mobile pattern for this app's data-dense tables.

---

## PART 4 — SHORTLIST ITEM SPECS (no new connections)

Each spec below is sized to hand directly to a lighter model. Same format throughout: Purpose → Data model → Files → Component plan → Build steps → Estimate.

---

### 4.1 Watchlist Notes & Target Price UI

**Purpose:** `watchlist.note` and `watchlist.targetPrice` columns already exist in the schema (confirmed in `db/schema.ts` / `TECHNICAL_SPEC.docx §4`) but have no real editing UI — currently write-only via nothing, i.e. dead columns. Give the user an inline editor.

**Data model:** No changes — columns already exist.

**Files:**
- `app/watchlist/page.tsx` — add expandable row or inline note/target cells
- `app/watchlist/actions.ts` — add `updateWatchlistNote(instrumentId, note)` and `updateWatchlistTarget(instrumentId, targetPrice)` server actions
- New: `components/watchlist-note-editor.tsx` (client component)

**Component plan:**
- Add a "Note" column to the watchlist table (or a small 📝 icon that expands a row into a detail strip). Recommend the icon-expand approach to avoid adding yet another column to an already-tight table (mobile: §2.2 scroll affordance already handles overflow, but fewer default columns is still better).
- Clicking the icon reveals: a `<textarea>` for note (save on blur) + a small `<input type="number">` for target price (save on blur, client-side validate >0).
- Server actions do simple `UPDATE watchlist SET note = ?, targetPrice = ? WHERE instrumentId = ?` via Drizzle.

**Build steps:**
1. Add the two server actions (with one unhappy-path test each: invalid target price rejected, empty note allowed/clears).
2. Add `WatchlistNoteEditor` component.
3. Wire into `app/watchlist/page.tsx` row.
4. Test: add note, refresh page, confirm persisted. Add target price, confirm persisted, confirm rejects negative/zero.

**Estimate: 3 hours**

---

### 4.2 Dashboard Refresh-Status Badge

**Purpose:** Users can't tell if dashboard data is fresh without visiting Admin. Surface it directly.

**Data model:** No changes — `apiCalls` table (from the 2026-08-06 API Connections work) and/or `MAX(prices_daily.date)` already give everything needed.

**Files:**
- `app/page.tsx` (Dashboard) — add badge to header
- `lib/audit/tracker.ts` — add `getLastRefreshSummary()` server action (reuses existing `apiCalls`/audit-event queries; look at `getApiStats` and `getRecentEvents` already in this file for the pattern — this is a thin wrapper, not new plumbing)

**Component plan:**
- Small pill/badge next to the Dashboard page title: `"Last updated 2h ago"` (relative time from most recent `data_refresh` audit event with `action: "Manual refresh completed"` or the cron equivalent).
- If no refresh has ever run: `"No data yet — run a refresh"` (matches existing empty-state tone from the style guide §6).
- No "next scheduled" claim unless the cron schedule is actually readable at runtime — cron is `3:00 AM UTC daily` per `TECHNICAL_SPEC`, which is a static fact, safe to hardcode as `"Next: 3:00 AM UTC"`.

**Build steps:**
1. `getLastRefreshSummary()` — query `auditEvents` for latest `eventType: "data_refresh"`, `action LIKE "%completed%"`, return `{ lastRefreshAt: string | null }`.
2. Badge component (can be inline JSX in `app/page.tsx`, doesn't need its own file — this is small).
3. Relative-time formatting: check if a `formatTimeEST`-style helper already covers "2 hours ago" style output (`lib/format-time.ts` — confirm before writing a new one; reuse or extend).

**Estimate: 2 hours**

---

### 4.3 Dashboard Sector Composition Chart

**Purpose:** One-glance concentration check — what % of the watchlist sits in each sector.

**Data model:** No changes — `instruments.sector` already exists (confirmed `TECHNICAL_SPEC §4`).

**Files:**
- `app/page.tsx` — add new Card
- `app/dashboard/actions.ts` (or wherever dashboard server actions live — check `app/page.tsx` imports first) — add `getSectorBreakdown()` 
- New: `components/sector-donut.tsx` (client component)

**Component plan:**
- Query: join `watchlist` → `instruments`, `GROUP BY sector`, `COUNT(*)` (count-based, not score-weighted — simpler and defensible; score-weighting is a v2 idea, don't over-build v1).
- Chart: Recharts `PieChart` with `innerRadius` set (donut, not full pie) — reuse the exact pattern already validated on the instrument detail page (per `TECHNICAL_SPEC` "Charts (shipped, C3)").
- Use the **categorical series palette from VISUAL_STYLE_GUIDE §2.2** — 8 fixed slots, color follows sector name consistently (not re-assigned on filter), per the guide's explicit "color follows the entity, never its rank" rule. Cap at 8 sectors; fold any excess into "Other" per the guide's own scatter/chart overflow rule.
- Empty state: if watchlist is empty or all instruments lack a `sector` value, show the existing empty-state pattern ("No sector data yet").

**Build steps:**
1. `getSectorBreakdown()` server action + 1 unhappy-path test (empty watchlist → empty array, not a crash).
2. `SectorDonut` component.
3. Wire into Dashboard grid (`col-span-12 lg:col-span-4` alongside existing cards, consistent with the grid pattern already used everywhere else on this page).

**Estimate: 4 hours**

---

### 4.4 Screener Column Customization

**Purpose:** Let users toggle which metrics show in the Screener table (P/E, FCF yield, debt/equity, etc.) — different research styles want different density.

**Data model:** No DB changes required for v1 — store preference in `localStorage` (key: `screener_visible_columns`, JSON array of column keys). A `user_preferences` DB table is a clean v2 upgrade if the user ever wants preferences to follow them across devices, but this is a single-user local app today — don't build DB-backed prefs until there's a second device/session that needs it.

**Files:**
- `app/screener/page.tsx` — column visibility state + toggle UI
- New: `components/column-picker.tsx` (client component)

**Component plan:**
- "Columns" button opens a small dropdown/popover with checkboxes for each optional column (Valuation, Growth, Quality, Momentum, Confidence — Symbol/Trend/Score stay pinned, non-optional).
- State persisted to `localStorage` on change, read on mount (same SSR-safe pattern as the optional nav-collapse preference in §1.5 — default to "all columns visible" on first paint, then apply stored prefs after mount to avoid hydration mismatch).
- Table renders columns conditionally based on visibility state.

**Build steps:**
1. `ColumnPicker` component (checkboxes, controlled by parent state).
2. Wire into `app/screener/page.tsx`: lift visibility state up, conditionally render `<th>`/`<td>` per column.
3. localStorage read/write helpers (small, inline is fine — no need for a new lib file for 5 lines).
4. Test: toggle a column off, refresh page, confirm it stays off.

**Estimate: 5 hours**

---

### 4.5 Watchlist Collections / Folders

**Purpose:** User-defined groupings ("Tech plays", "Dividend candidates") so a large watchlist stays scannable. Highest-effort item on this list because it's the only one needing a real schema change.

**Data model — new migration required:**
```sql
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,           -- optional, one of the 8 categorical palette slots
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);
-- add nullable FK to watchlist
ALTER TABLE watchlist ADD COLUMN collectionId TEXT REFERENCES collections(id);
```
Follow the existing migration convention exactly: generate via `drizzle-kit generate`, then **verify the output file includes `--> statement-breakpoint` markers** between statements (per the `TECHNICAL_SPEC §7` known-risk note — hand-editing this file without those markers will pass locally and fail on Turso in production; this bit the team once already on 2026-08-05, don't repeat it).

**Files:**
- `db/schema.ts` — add `collections` table, add `collectionId` to `watchlist`
- New migration file
- `app/watchlist/actions.ts` — `createCollection(name)`, `assignToCollection(instrumentId, collectionId | null)`, extend `getWatchlistWithQuotes()` to include `collectionId`/`collectionName`
- `app/watchlist/page.tsx` — collection filter tabs + assign-to-collection UI
- New: `components/collection-tabs.tsx`

**Component plan:**
- Tabs above the watchlist table: `[All] [Tech Plays] [Dividend Candidates] [Uncategorized] [+ New Collection]`.
- "+ New Collection" opens a minimal inline text input (name only for v1 — skip color picker unless trivial, it's a nice-to-have not a requirement).
- Per-row: a small dropdown/menu to assign the instrument to a collection (or move to Uncategorized).
- Uncategorized = `collectionId IS NULL`, always exists implicitly, never user-deletable.

**Build steps:**
1. Schema + migration (verify breakpoint markers, verify `Admin > Apply DB Migrations` succeeds against Turso before calling this step done — per `CLAUDE.md` production-verification rule).
2. Server actions + tests (include an unhappy path: assigning to a nonexistent `collectionId` should fail cleanly, not silently orphan the row).
3. `CollectionTabs` component + row-assignment UI.
4. Wire filter state into the watchlist query/render.

**Estimate: 6 hours** (includes migration risk buffer).

---

### 4.6 Instrument Detail Scorecard

**Purpose:** Show Composite + 4 factor scores "above the fold," before the price chart — currently the user has to scroll past the chart to reach the existing score panel.

**Data model:** No changes — `factor_scores` table already has everything (`TECHNICAL_SPEC §4`).

**Files:**
- `app/instrument/[symbol]/page.tsx` — reorder existing sections, no new query (the score data is already fetched on this page today per earlier session work — confirm the existing query shape before adding a duplicate one)
- New: `components/score-summary-card.tsx`

**Component plan:**
- This is primarily a **layout reorder**, not new data plumbing: move the existing Composite/Valuation/Growth/Quality/Momentum block (currently rendered in the right-hand "Score" card, per the screenshot evidence from earlier in this session showing `AAPL` instrument page) to render **first**, full-width, above the price chart, on mobile specifically (`grid-cols-1` stacking already applies below `lg` if the page uses the same `col-span-12 lg:col-span-N` convention — confirm and align if not).
- Desktop layout (chart left, score right, side-by-side) stays unchanged — this is a mobile-order fix primarily, with a light visual refresh (larger composite number, tighter factor-score row) as a bonus.

**Build steps:**
1. Confirm current DOM order in `app/instrument/[symbol]/page.tsx` (chart-then-score, per earlier screenshots).
2. Extract the score block into `ScoreSummaryCard` if not already its own component.
3. Reorder: on mobile, `ScoreSummaryCard` renders first; use CSS `order` utilities or actual JSX reorder + `lg:` grid classes rather than fighting flex-order (JSX reorder is more predictable and accessible — screen readers read DOM order, not visual order, so don't rely on CSS `order` alone for a meaningful content reorder).

**Estimate: 6 hours**

---

### 4.7 News Page Redesign

**Purpose:** Full spec already written and delivered separately — see `NEWS_PAGE_REDESIGN.md` (sent to the user 2026-08-06, also logged in `ENHANCEMENTS.docx`). Not re-derived here; referenced for completeness of this consolidated plan.

**Summary for this doc:** sector/asset-class tabs, time filter (24h/7d/30d), "Your Holdings" + "Trending Today" + "All Headlines" sections, sentiment badges (heuristic, no new API), clip/dismiss via browser storage, related-symbol highlighting. Uses existing RSS feed infrastructure — zero new connections.

**Mobile-specific addendum (new, not in the original spec):** the tab bar (`ALL / TECH / HEALTHCARE / ...`) must scroll horizontally on mobile (`overflow-x-auto`, no wrap) rather than attempting to fit 9 tabs into 375px — add this explicitly to the original spec's §1 (Sector Tabs) before building.

**Estimate: 23 hours** (unchanged from original spec; see that document for the full build plan).

---

## PART 5 — CONSOLIDATED BUILD ORDER (all 8 items, one sequence)

Recommended order — mobile nav first (it's the bug that's actually broken right now and unblocks fair testing of everything else on a phone), then quick wins, then the two schema/heavier items, then News last (biggest, most independent):

| Order | Item | Estimate | Cumulative |
|---|---|---|---|
| 1 | **Part 1 — Mobile nav drawer** | 6–8h | 8h |
| 2 | **Part 2 — Responsive polish** | 3–4h | 12h |
| 3 | 4.2 Dashboard refresh badge | 2h | 14h |
| 4 | 4.1 Watchlist notes/target UI | 3h | 17h |
| 5 | 4.3 Dashboard sector chart | 4h | 21h |
| 6 | 4.4 Screener column picker | 5h | 26h |
| 7 | 4.6 Instrument scorecard reorder | 6h | 32h |
| 8 | 4.5 Watchlist collections (schema change) | 6h | 38h |
| 9 | 4.7 News page redesign | 23h | 61h |
| — | (optional) §1.5 collapsed icon rail | 2h | 63h |

**Total: ~61 hours (~8 working days) for everything, ~63h with the optional collapsed rail.** Each numbered item above is independently shippable and independently testable — a lighter model can pick them up one at a time in this order, or skip around; nothing after item 1 depends on anything after item 2 except in the trivial sense of "the nav must not be broken while you test the rest."

Every item must, before being marked done, pass this project's standing QA bar (`CLAUDE.md`): tests written alongside (incl. one unhappy path), `npm run lint` clean by exit code, `npm test` passing, manual verification of the actual behavior (not assumed), CHANGELOG.md entry, and — for anything schema-related (4.5) — production verification against the real deployed Turso DB, not just local SQLite.

---

## PART 6 — WHAT THIS PLAN DELIBERATELY DEFERS

Not in scope for this plan (already correctly logged elsewhere, no action needed here):
- Backtesting engine, CSV export, mobile-audit-as-a-separate-line-item (superseded by Parts 1–2 above, which *is* the mobile audit/fix), WCAG 2.1 AA full audit (touch targets are addressed here; full contrast/ARIA audit remains a separate future pass).
- Anything requiring a new API key/provider/paid service (real-time quotes, email digest, Plaid, sentiment-scoring API) — unchanged in `ENHANCEMENTS.docx`'s "Requires New External Connection/Cost" section.

---

## PART 7 — EXACT DOCUMENTATION DELTAS (for the record)

This plan itself has already been wired into the project's real docs, not left as a standalone file:

1. **`VISUAL_STYLE_GUIDE.docx`** — new §7 "Responsive / Mobile Design" (breakpoint contract, corrected nav pattern, touch-target rule, gutter table, mobile table pattern). §5 nav row corrected to stop over-claiming a feature that didn't exist.
2. **`PROJECT_PLAN.docx`** — new **Epic H — Mobile Responsive Redesign** (H1–H4, this plan's Parts 1–2) and **Epic I — UX Enhancement Backlog** (I1–I7, this plan's Part 4 items), all status 🔲 Not Started, each Notes column pointing back to this document's section numbers so a future session (or a lighter model) can find the exact spec without re-deriving it.
3. **`ENHANCEMENTS.docx`** — the "No New Data Connections Required" table entries for these 8 items updated to note "full spec: MOBILE_AND_UX_ENHANCEMENT_PLAN.md" instead of one-line ideas.
4. **`CHANGELOG.md`** — dated entry recording that this planning pass happened, by whom (Opus), and that implementation is queued for a lighter model per the user's explicit workflow choice.

