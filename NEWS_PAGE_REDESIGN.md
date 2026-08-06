# News Page Redesign Specification
**Investment Research Dashboard**  
**Effort:** Medium (2-3 days)  
**Data Source:** Existing RSS feeds (no new API keys required)

---

## CURRENT STATE

The news page (`app/news/page.tsx`) currently displays:
- Basic list of headlines from RSS feeds
- Title, source, publish date
- Link to full story
- No filtering, grouping, or prioritization
- No connection to watchlist/portfolio

**Problem:** News is displayed but not contextualized — users can't quickly identify what's relevant to their holdings.

---

## PROPOSED REDESIGN

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ NEWS & MARKET INTELLIGENCE                              │
│ Last updated: 2 minutes ago                              │
├─────────────────────────────────────────────────────────┤
│ [ALL] [TECH] [HEALTHCARE] [FINANCE] [ENERGY] [CRYPTO]   │
│ [MACRO] [EARNINGS] [M&A]                                 │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search headlines...        ⏱ Last 24h ▼              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ⭐ YOUR HOLDINGS (3 headlines)                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [🔴 NEGATIVE]  Apple to Delay AI Features          │  │
│ │ → Affects: AAPL                                    │  │
│ │ Reuters · 2 hours ago                              │  │
│ │ "Apple announces delay in AI rollout..."           │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 🔥 TRENDING TODAY (10 headlines)                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [🟢 POSITIVE]  Fed Signals Rate Cut                │  │
│ │ → Affects: TLT, IEF, Bank Stocks                  │  │
│ │ Bloomberg via Reuters · 1 hour ago                 │  │
│ │ By: John Smith                                     │  │
│ │ "Federal Reserve chair signals economic..."       │  │
│ │ [  📌 Clip  ][  🔗 Full Story  ]                  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 📡 ALL HEADLINES (400+ stories)                         │
│ [Load 20 more...]                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## FEATURE SPECIFICATIONS

### 1. SECTOR TABS & FILTERING
**UI Element:** Horizontal tab bar below header

**Tabs:**
- `ALL` (default) — all headlines
- `TECH` — technology sector news
- `HEALTHCARE` — healthcare, pharma, biotech
- `FINANCE` — banking, insurance, fintech
- `ENERGY` — oil, gas, renewables
- `MACRO` — GDP, inflation, Fed, international
- `EARNINGS` — corporate earnings reports
- `M&A` — mergers, acquisitions, spinoffs
- `CRYPTO` — cryptocurrency market news
- `YOUR HOLDINGS` — filtered to symbols in watchlist/portfolio

**Implementation:**
- Server-side filtering by RSS source tags or client-side filtering post-fetch
- Tab state in URL (`?tab=tech`) so bookmarkable
- Active tab highlighted with underline

### 2. TIME FILTERING
**UI Element:** Dropdown in top-right corner

**Options:**
- `Last 24h` (default)
- `Last 7d`
- `Last 30d`
- `All time`

**Implementation:**
- Server-side filter on `publishedAt` timestamp (already in schema)
- URL param (`?days=7`)

### 3. HEADLINE GROUPING & PRIORITIZATION

#### "YOUR HOLDINGS" Section (Pinned at top)
- Headlines matching symbols in user's watchlist OR portfolio holdings
- Grouped by which symbol(s) are affected
- Max 5 headlines
- If none, show "No recent headlines for your holdings"

**Query:**
```sql
SELECT * FROM news_items 
WHERE tickersCsv LIKE '%AAPL%' OR tickersCsv LIKE '%MSFT%' ...
ORDER BY publishedAt DESC 
LIMIT 5
```

#### "TRENDING TODAY" Section (Second)
- Headlines sorted by relevance (number of symbols mentioned, engagement implied)
- Top 10 most-mentioned symbols in today's news
- Visual weight/size to indicate mention count

**Query:**
```sql
SELECT *, (LENGTH(tickersCsv) - LENGTH(REPLACE(tickersCsv, ',', ''))) as symbol_count
FROM news_items 
WHERE DATE(publishedAt) = DATE('now')
ORDER BY symbol_count DESC, publishedAt DESC
LIMIT 10
```

#### "ALL HEADLINES" Section (Scrollable/Paginated)
- Full list, scrollable (infinite scroll or "Load 20 more" button)
- 20 headlines per page

### 4. HEADLINE CARDS

**Card Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [🟢 POSITIVE] Headline Title Here                       │
│                                                          │
│ → Affects: AAPL, MSFT, XLK                             │
│ Bloomberg · John Smith · 2 hours ago                    │
│ "Headline preview text up to 140 chars..."             │
│                                                          │
│ [  📌 Clip  ]  [  ↗ Full Story  ]  [  ✕  Dismiss  ]   │
└─────────────────────────────────────────────────────────┘
```

**Card Components:**

1. **Sentiment Indicator** (left badge, optional)
   - 🟢 POSITIVE (green) — stock up, earnings beat, new product, acquisition
   - ⚪ NEUTRAL (gray) — earnings, general news, announcement
   - 🔴 NEGATIVE (red) — stock down, earnings miss, lawsuit, scandal
   - *Note: Sentiment is heuristic; show confidence level (<80% = gray border)*

2. **Headline Title**
   - Clickable, links to full story
   - Truncate to 1 line (60 chars) if on card; full on hover

3. **Related Holdings**
   - `→ Affects: AAPL, MSFT, XLK` (only if symbols detected)
   - Each symbol clickable → drill to that instrument page
   - Max 3 symbols shown; click "& 2 more" for full list

4. **Attribution**
   - Source (Reuters, AP, Bloomberg, etc.)
   - Author (if available, may be "Staff")
   - Publish time (2 hours ago, 1 day ago, etc.)

5. **Preview Text**
   - 140 chars of headline or first paragraph
   - Ellipsis if truncated

6. **Action Buttons**
   - 📌 **Clip** — save to local browser storage (localStorage key: `clipped_news`)
   - ↗ **Full Story** — opens URL in new tab
   - ✕ **Dismiss** — hide this story for rest of session (sessionStorage)

### 5. SEARCH & FILTERING

**Search Bar**
- Input: "Search headlines..."
- Scope: title + preview text
- Real-time as user types (client-side filter; server-side if 100+ items)
- Highlight matching terms in results

**Filter Controls**
- Source filter (Reuters, AP, Bloomberg, etc.) — multi-select dropdown
- Sector filter (tabs above; can multi-select)
- Time range (dropdown: 24h/7d/30d)

### 6. DATA SOURCES

**Existing RSS Feeds** (from data/feeds.ts or similar):
- Reuters (top headlines)
- AP News (general)
- Bloomberg (via RSS proxy if available)
- MarketWatch (markets section)
- Seeking Alpha (earnings calendar)
- CoinDesk (crypto news)
- Fed calendar + event announcements

**No new API keys required** — RSS is free and already configured.

### 7. SYMBOL TAGGING

Current schema has `news_items.tickersCsv` (comma-separated symbol list).

**Improvement:** Enhance symbol detection when fetching headlines:
- Parse headline text for known tickers ($AAPL, $MSFT)
- Cross-ref with instruments table
- Handle ambiguous cases (e.g., "Apple" in text vs $AAPL tag)
- Store with confidence score (high/medium/low)

```typescript
// Example
interface NewsItem {
  id: string;
  publishedAt: string;
  source: string;
  title: string;
  url: string;
  preview?: string;
  tickersCsv?: string;        // AAPL,MSFT,XLK
  detectedSymbols?: {
    symbol: string;
    confidence: 'high' | 'medium' | 'low';
    reason: 'explicit_tag' | 'text_mention' | 'category_match';
  }[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentConfidence?: number; // 0-100
}
```

### 8. PERFORMANCE

**Load Optimization:**
- Fetch headlines once on page load (background job already does this daily)
- Client-side filtering for tabs, search, time range
- Server-side sorting (by publication date, trending rank)
- Lazy-load images if present (most RSS headlines are text-only)
- Infinite scroll with "Load 20 more" threshold (3 screens down)

**Caching:**
- Headlines already cached in DB (via daily refresh cron)
- Persist page state (tab, search query) in URL
- Clip/dismiss state in browser storage (persist across sessions)

---

## IMPLEMENTATION STEPS

### Step 1: Update Data Model (if needed)
- Add `sentiment`, `sentimentConfidence`, `author` to `news_items` table
- Add `detectedSymbols` (JSON or separate table)
- Run migration

### Step 2: Enhance Headline Fetching
- Improve symbol detection in RSS parsing
- Add sentiment detection (heuristic: keywords, headline patterns)
- Populate new fields during refresh pipeline

### Step 3: Build News Page Components
```
components/
  ├── news-header.tsx (title, last-updated, refresh button)
  ├── news-tabs.tsx (sector tabs, active state)
  ├── news-filters.tsx (search, time range, source)
  ├── news-card.tsx (single headline card with actions)
  ├── news-sections.tsx (YOUR HOLDINGS, TRENDING, ALL)
  └── news-sentiment-badge.tsx (indicator icon)

app/news/
  ├── page.tsx (container, state management)
  ├── actions.ts (getHeadlines, filterHeadlines server actions)
  └── layout.tsx (header)
```

### Step 4: Add Client-Side Features
- Tab switching (URL state)
- Search filtering (real-time)
- Clip/dismiss (localStorage)
- Related symbols drill-down (Link to /instrument/[symbol])

### Step 5: Styling
- Use existing Tailwind tokens (text-gain, text-loss, bg-surface, etc.)
- Card hover effect (shadow, slight scale)
- Sentiment badge colors (green, gray, red)
- Responsive: wrap tabs on mobile, stack cards to full width

### Step 6: Testing
- Unit tests for filtering logic
- Visual regression tests for card layout
- Test with various headline lengths, symbol counts
- Test with 0 headlines, many headlines

### Step 7: Documentation
- Update USER_GUIDE.docx with news page walkthrough
- Update CHANGELOG.md
- Update ENHANCEMENTS.docx (move to "Implemented")

---

## DESIGN SPECIFICATIONS

### Color Palette
- **Positive Sentiment:** `var(--gain-text)` (green, existing token)
- **Negative Sentiment:** `var(--loss-text)` (red, existing token)
- **Neutral/Gray:** `var(--muted)` (gray)
- **Card Background:** `var(--surface)` (subtle bg)
- **Hover:** `var(--page)` (slightly darker on hover)

### Typography
- **Headline Title:** Tailwind `text-base font-semibold`
- **Source/Author:** Tailwind `text-xs text-muted`
- **Preview:** Tailwind `text-sm text-muted`
- **Time:** Tailwind `text-xs text-muted italic`

### Spacing
- **Card padding:** `px-4 py-3`
- **Card margin:** `mb-3` (12px between cards)
- **Tab padding:** `px-3 py-2`
- **Section margin:** `mb-8` (32px between sections)

---

## FUTURE ENHANCEMENTS

1. **Sentiment API integration** (optional paid service for accuracy)
2. **Email digest option** ("Send me top 3 headlines daily")
3. **Headline recommendations** (ML model: "you usually read about Tech")
4. **News source reputation scoring** (trust score, bias detection)
5. **Earnings calendar integration** (highlight upcoming earnings dates)
6. **Geopolitical/macro overlay** ("Today's rate decision affects USD")

---

## ESTIMATE

| Task | Effort | Notes |
|------|--------|-------|
| Data model updates | 2h | Add sentiment, author, detected symbols |
| RSS parsing enhancement | 4h | Improve symbol tagging & sentiment |
| Component build | 6h | news-{header,tabs,filters,card,sections} |
| Page logic & state | 3h | Filtering, pagination, URL state |
| Styling & responsive | 4h | Cards, tabs, badges, mobile layout |
| Testing | 3h | Unit tests, visual regression, edge cases |
| Docs & CHANGELOG | 1h | USER_GUIDE, ENHANCEMENTS, CHANGELOG |
| **TOTAL** | **23h** | ~3 days for 1 developer |

---

## MOCKUP (ASCII)

```
╔════════════════════════════════════════════════════════════╗
║ NEWS & MARKET INTELLIGENCE                                ║
║ Last updated: 2 minutes ago                    [Refresh 🔄] ║
╠════════════════════════════════════════════════════════════╣
║ [ALL] [TECH] [HEALTHCARE] [FINANCE] [MACRO] [CRYPTO]      ║
╠════════════════════════════════════════════════════════════╣
║ 🔍 Search headlines... [dropdown] Last 24h [✕ filters]    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║ ⭐ YOUR HOLDINGS (3 headlines)                            ║
║ ┌──────────────────────────────────────────────────────┐  ║
║ │ 🟢 Apple to Delay AI Features                         │  ║
║ │ → Affects: AAPL                                      │  ║
║ │ Reuters · 2 hours ago                                │  ║
║ │ "Apple announces delay in AI rollout..."            │  ║
║ │ [📌 Clip] [↗ Story] [✕]                             │  ║
║ └──────────────────────────────────────────────────────┘  ║
║                                                            ║
║ 🔥 TRENDING TODAY (10 headlines)                          ║
║ ┌──────────────────────────────────────────────────────┐  ║
║ │ 🔴 Fed Signals Rate Cut                              │  ║
║ │ → Affects: TLT, IEF, XLF                            │  ║
║ │ Bloomberg · 1 hour ago                               │  ║
║ │ "Federal Reserve signals economic shift..."         │  ║
║ │ [📌 Clip] [↗ Story] [✕]                             │  ║
║ └──────────────────────────────────────────────────────┘  ║
║                                                            ║
║ 📡 ALL HEADLINES (400+ stories)                          ║
║ [Load 20 more...]                                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## NEXT STEPS

1. **Approve design** — Does this direction match your vision?
2. **Prioritize enhancements** — Rank this vs other backlog items
3. **Allocate sprint** — Assign developer time
4. **Implement** — Follow steps above
5. **Test & validate** — QA against real news feeds
6. **Deploy** — Push to production with full documentation

