/**
 * Generates VISUAL_STYLE_GUIDE.docx.
 * Palette adopted from the validated dataviz reference palette
 * (validate_palette.js: ALL CHECKS PASS, light + dark, 2026-08-03).
 * Every UI deliverable references this doc rather than re-deciding.
 */
import { bullet, h1, h2, note, p, table, titlePage, TODAY, writeDoc } from "./helpers.mjs";

const swatch = (hex) => ({ text: hex, fill: hex.replace("#", "") });

await writeDoc("VISUAL_STYLE_GUIDE.docx", [
  ...titlePage("Visual Style Guide", "Investment Research Dashboard", TODAY),

  h1("1. Design intent"),
  p("A calm, data-dense research surface: recessive chrome, ink-on-paper neutrals, color reserved for data and state. Both light and dark modes are first-class (dark values are re-stepped, not auto-inverted). Numbers are the interface — everything else stays out of their way."),

  h1("2. Color palette"),
  h2("2.1 Surfaces & ink"),
  table(["Role", "Light", "Dark"], [
    ["Page plane", swatch("#f9f9f7"), swatch("#0d0d0d")],
    ["Card / chart surface", swatch("#fcfcfb"), swatch("#1a1a19")],
    ["Primary ink (text)", swatch("#0b0b0b"), swatch("#ffffff")],
    ["Secondary ink", swatch("#52514e"), swatch("#c3c2b7")],
    ["Muted (axis, captions)", swatch("#898781"), swatch("#898781")],
    ["Hairline grid", swatch("#e1e0d9"), swatch("#2c2c2a")],
    ["Baseline / border", swatch("#c3c2b7"), swatch("#383835")],
    ["Accent (links, active nav, primary button)", swatch("#2a78d6"), swatch("#3987e5")],
  ], { widths: [44, 28, 28] }),

  h2("2.2 Categorical series palette (charts — fixed slot order, never cycled)"),
  table(["Slot", "Hue", "Light", "Dark"], [
    ["1", "blue", swatch("#2a78d6"), swatch("#3987e5")],
    ["2", "orange", swatch("#eb6834"), swatch("#d95926")],
    ["3", "aqua", swatch("#1baf7a"), swatch("#199e70")],
    ["4", "yellow", swatch("#eda100"), swatch("#c98500")],
    ["5", "magenta", swatch("#e87ba4"), swatch("#d55181")],
    ["6", "green", swatch("#008300"), swatch("#008300")],
    ["7", "violet", swatch("#4a3aa7"), swatch("#9085e9")],
    ["8", "red", swatch("#e34948"), swatch("#e66767")],
  ], { widths: [10, 18, 36, 36] }),
  bullet("Validated with the dataviz six-check validator: ALL CHECKS PASS in both modes (worst adjacent CVD ΔE 9.1 light / 8.4 dark)."),
  bullet("Relief rule (obligation): slots 3–5 sit below 3:1 contrast on the light surface, so any chart using them ships visible direct labels or a table view."),
  bullet("Scatter/bubble/choropleth/small-multiples: only slots 1–3 validate all-pairs; past three series, fold to 'Other' or facet."),
  bullet("Color follows the entity, never its rank — filtering a chart must not repaint surviving series."),

  h2("2.3 Status & financial semantics (reserved — never used as series colors)"),
  table(["Role", "Hex", "Usage"], [
    ["Good / positive", swatch("#0ca30c"), "Status chips; gain deltas on dark. Light-mode gain TEXT uses #006300 (4.5:1)."],
    ["Warning", swatch("#fab219"), "Data staleness, low-confidence score flags. Always icon + label, never color alone."],
    ["Serious", swatch("#ec835a"), "Degraded provider, partial refresh."],
    ["Critical / negative", swatch("#d03b3b"), "Errors; loss deltas."],
  ], { widths: [24, 20, 56] }),
  bullet([{ text: "Gains/losses: ", bold: true }, { text: "every delta pairs color with a sign and arrow (▲ +2.4% / ▼ −1.1%) — color is never the only carrier, for CVD safety." }]),
  bullet("Sequential ramps (heatmaps): blue one-hue ramp #cde2fb → #0d366b. Diverging (performance vs benchmark): blue ↔ red with neutral gray midpoint (#f0efec light / #383835 dark)."),

  h1("3. Typography"),
  table(["Use", "Spec"], [
    ["Everything (UI + figures)", 'System sans: system-ui, -apple-system, "Segoe UI", sans-serif. No display/serif faces.'],
    ["Page title", "24px / 600"],
    ["Section heading", "18px / 600"],
    ["Card title", "14px / 600, secondary ink"],
    ["Body / labels", "14px / 400"],
    ["Captions, axis ticks", "12px / 400, muted ink"],
    ["Hero numbers (stat tiles)", "28–36px / 600, proportional figures"],
    ["Numeric table columns & axis ticks", "font-variant-numeric: tabular-nums (vertical alignment)"],
  ], { widths: [40, 60] }),

  h1("4. Spacing & layout grid"),
  bullet("Base unit 4px; components use multiples (8 / 12 / 16 / 24 / 32)."),
  bullet("Page: max-width 1440px, 24px gutters; dashboard is a 12-column CSS grid, cards spanning 3–12 columns."),
  bullet("Cards: 16px internal padding, 8px radius, hairline border (rgba ink at 10%), no drop shadows — borders and surface steps carry elevation."),
  bullet("Data density beats whitespace: tables at 8px vertical cell padding; charts get a fixed 220px height in overview cards."),

  h1("5. Core component patterns"),
  table(["Component", "Pattern"], [
    ["Primary button", "Accent fill, white text, 8px radius, 32px height, 12px horizontal padding. One per view."],
    ["Secondary button", "Hairline border, primary ink, transparent fill; hover = ghost wash."],
    ["Destructive button", "Loss-color fill, white text, same 8px radius/32px height as primary — reserved for permanent/irreversible actions (e.g. Admin > Delete Instrument). Disabled state at 50% opacity like every other button."],
    ["Forms / inputs", "32px height, hairline border, 6px radius, accent focus ring; labels above, 12px secondary ink; inline errors in critical color + icon."],
    ["Cards", "Surface color, hairline border, card title top-left, optional caption right, body below; every metric card shows its as-of timestamp."],
    ["Nav — desktop (≥1024px)", "Persistent left rail 220px: Dashboard, Watchlist, Screener, Markets, News, Research, Oracle, Portfolio, Launchpad, Settings, Admin. Active item = accent text + accent left bar. Row height 32px. Optional icon-only collapsed state (planned, §7.2) — not yet built; do not describe as shipped until it is."],
    ["Nav — mobile/tablet (<1024px)", "48px top app bar (hamburger left, wordmark center, theme toggle right) + off-canvas drawer sliding from the left over a dim backdrop. Same nav model/data as desktop (lib/nav.ts), same icon set (components/nav-icons.tsx, shared — not duplicated), row height 44px for touch. See §7.1."],
    ["Tables", "Sticky header, tabular-nums for numerics, right-aligned numbers, hairline row separators, hover wash, sortable columns with ▲▼ indicator."],
    ["Score badge", "0–100 composite in a rounded chip on a loss-to-gain gradient fill (as shipped in Screener/Watchlist) — the color reads directionally at a glance; low-confidence adds the warning icon."],
    ["Charts", "Per the dataviz method: thin marks, 2px lines, hairline grid, one axis (never dual-axis), legend for ≥2 series, crosshair + tooltip hover layer, as-of timestamp in the caption."],
    ["Empty / error states", "Explain what's missing and the next action ('No data yet — run a refresh'); errors name the provider and keep the last good data visible with a staleness badge."],
  ], { widths: [22, 78] }),

  h1("7. Responsive / Mobile Design"),
  p("The app was built desktop-first and, as of 2026-08-06, the shell has no mobile layout at all — the 220px rail is permanently docked at every viewport width, which on a ~390px phone leaves roughly 90–110px of usable content width. Full diagnosis and build-ready fix plan: MOBILE_AND_UX_ENHANCEMENT_PLAN.md (Epic H). This section documents the target state; treat any line below as 'planned' unless the corresponding Epic H deliverable in PROJECT_PLAN.docx is marked done."),
  h2("7.1 Breakpoint contract"),
  bullet([{ text: "≥1024px (lg): ", bold: true }, { text: "desktop nav mode — persistent 220px rail, no top app bar." }]),
  bullet([{ text: "<1024px: ", bold: true }, { text: "mobile/tablet nav mode — rail hidden, 48px top app bar + off-canvas drawer. Tablet in portrait intentionally gets the mobile pattern, not a squeezed desktop rail." }]),
  bullet("Individual pages may use sm (640px) / md (768px) breakpoints for internal stacking (e.g. a 3-column stat row collapsing to 1 column) — lg is the only breakpoint the shell itself keys off."),
  h2("7.2 Nav collapse (drawer vs. optional icon rail)"),
  bullet("Mobile/tablet (<lg): off-canvas drawer, 260px wide, slides from the left over a 40%-opacity backdrop; closes on backdrop click, link click, or Escape. Body scroll locked while open."),
  bullet("Desktop (≥lg): unchanged persistent rail. An icon-only collapsed state (56px, labels as hover tooltips, preference persisted to localStorage) is a documented but not-yet-built optional enhancement — this is what closes the gap on the earlier inaccurate 'collapsible to icons' claim."),
  h2("7.3 Touch targets"),
  bullet("Any interactive element reachable at <lg viewport widths (drawer nav rows, hamburger button, primary page actions) must be ≥44×44px per Apple HIG / WCAG 2.5.5."),
  bullet("Desktop-only dense controls are explicitly exempt: 32px desktop nav rows, 32px icon-only row actions inside overflow-x-auto tables (e.g. watchlist row remove button). Don't 'fix' these to 44px on desktop — that breaks the data-density goal in §4."),
  h2("7.4 Page gutters & spacing by breakpoint"),
  bullet("Page padding: 16px (px-4) below lg, 24px (px-6) at lg and above. Card/table internal padding (§4) is unchanged at every breakpoint."),
  h2("7.5 Tables on mobile"),
  bullet("Horizontal scroll (overflow-x-auto) is the accepted, intentional pattern for dense tables (Watchlist, Screener, admin call-history) on narrow viewports — do not attempt to reflow table rows into stacked cards for v1."),
  bullet("Scrollable table wrappers below lg should signal more content exists via a trailing-edge fade (CSS mask-image gradient) rather than leaving the cutoff silent."),

  h1("8. Tone & voice (UI copy)"),
  bullet("Plain, precise, unexcited. 'AAPL scores 74 (Balanced)' — never 'AAPL is a great buy!'"),
  bullet("Numbers carry units and as-of dates. Missing data says '—' and why, never a silent zero."),
  bullet("Uncertainty is stated: low-confidence scores, delayed quotes, and unofficial sources are labeled."),
  bullet("Research aid, not advice: the screener footer carries 'Not investment advice' persistently."),
  note("Generated by scripts/gen-docs/style-guide.mjs — palette changes must re-run the dataviz validator before landing here."),
]);
