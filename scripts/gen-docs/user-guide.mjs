/** Generates USER_GUIDE.docx — written for a non-technical reader. */
import { bullet, h1, note, p, titlePage, TODAY, writeDoc } from "./helpers.mjs";

await writeDoc("USER_GUIDE.docx", [
  ...titlePage("User Guide", "Investment Research Dashboard", TODAY),

  h1("What this app does"),
  p("This is your personal investment research desk. It automatically gathers up-to-date prices, company financials, economic data, and news for stocks, ETFs, cryptocurrencies, and bonds — then highlights which investments look most promising based on clear, explainable rules you can inspect and tune. It is a research aid: it organizes evidence and points at candidates, but the decisions stay with you. Nothing in it is investment advice."),

  h1("Current status"),
  p("The app is live and working — open it from your computer or your phone at investment-research-weld.vercel.app. Every feature described below is built and running. The one exception is Oracle, which is a placeholder page for now (see \"Where everything lives\")."),
  p("A few pages start out empty the first time you use them — that's normal, not broken. Prices, factor scores, and news only appear after you run a refresh (see \"Getting started\" below), and your retirement-account holdings only show up after you've entered them once."),

  h1("Getting started"),
  p("Do this once, in order, from the Settings page:"),
  bullet("1. Seed Transamerica Funds — loads the fund menu for your retirement plans."),
  bullet("2. Setup Main 403b Account and Setup Management Staff IRA — creates your two accounts with their current holdings."),
  bullet("3. Open the \"Portfolio Analysis\" section and run, in order: Initialize Economic Calendar, then Generate Optimization Suggestions, then Assess Event Impact — this is what fills in the swap suggestions and the news/events narrative on your Portfolio page."),
  p("Then, from the Admin page, click Trigger Manual Refresh whenever you want current prices, scores, and news for whatever's on your watchlist — this also runs automatically once a day. Add a few tickers to your Watchlist first (see below) so there's something for the refresh to fetch."),

  h1("Where everything lives"),
  bullet([{ text: "Dashboard — ", bold: true }, { text: "a quick snapshot of your watchlist prices, market indices, and latest headlines." }]),
  bullet([{ text: "Watchlist — ", bold: true }, { text: "the stocks/ETFs you're tracking, with live prices and scores." }]),
  bullet([{ text: "Screener — ", bold: true }, { text: "your watchlist ranked by score, side by side." }]),
  bullet([{ text: "Markets — ", bold: true }, { text: "major indices, the yield curve, crypto, and upcoming economic events." }]),
  bullet([{ text: "News — ", bold: true }, { text: "headlines tagged to your watchlist tickers." }]),
  bullet([{ text: "Oracle — ", bold: true }, { text: "not built yet. It's reserved for future AI-driven recommendations; the page says so." }]),
  bullet([{ text: "Portfolio — ", bold: true }, { text: "your retirement accounts: balances, holdings, optimization suggestions, and the news/events assessment. Switch between your two accounts from the tabs at the top." }]),
  bullet([{ text: "Settings — ", bold: true }, { text: "one-time setup: load fund data, create your accounts, run the portfolio analysis." }]),
  bullet([{ text: "Admin — ", bold: true }, { text: "trigger a manual data refresh, apply database updates, and see system health (API usage, cache status, recent activity)." }]),

  h1("See the market at a glance"),
  bullet("The Dashboard shows your watchlist's current prices, a snapshot of major indices, and your latest headlines — each refreshed by the same manual/daily refresh described above."),
  bullet("The Markets page adds the yield curve, a macro \"regime\" read (risk-on / risk-off / neutral), crypto prices, and upcoming Fed/CPI dates."),

  h1("Track what you own or watch"),
  bullet("Add a stock or ETF to your watchlist by typing its ticker (AAPL) or just the company name (Apple) — the app looks it up and adds the real symbol. If nothing matches, it tells you instead of guessing."),
  bullet("Each row shows price, day change, and its score (once a refresh has run). Remove anything with the ✕ on its row."),
  bullet("Click a ticker to open its detail page: price history and the full score breakdown."),

  h1("Find promising investments"),
  bullet("The Screener scores your watchlist 0–100 on four ideas: is it reasonably priced (Valuation), is the business growing (Growth), is it a well-run business (Quality), and is the price trending the right way (Momentum)."),
  bullet("Click any score to see exactly why — every number behind it is shown. If data is missing for a name, the app says so instead of guessing."),
  bullet("Sort by any individual factor from the dropdown, not just the overall score."),

  h1("Assess your retirement accounts"),
  bullet("Once your accounts are set up (see Getting started), the Portfolio page shows your combined picture: total balance, fees, and how your money is spread across categories — computed from your actual holdings, not a generic breakdown."),
  bullet("The app scores what you hold AND the alternatives your plan offers, then points out potential improvements — \"this fund in your lineup scores much higher than the one you hold, and costs less,\" with the real dollar savings estimate."),
  bullet("Each account also gets a written assessment that weighs what's happening in the world — upcoming Fed meetings, CPI releases — against your specific holdings, telling you which events matter and why. This is clearly separated from the scores above it, which stay pure math."),

  h1("Stay informed"),
  bullet("The News page shows headlines tagged to your watchlist tickers, with a quick sentiment read on each one."),
  bullet("The Markets page lists upcoming Fed meetings and CPI releases for the next 30 days."),

  h1("Good to know"),
  bullet("Data comes from free sources and can be 15 minutes to a day delayed — fine for research, not for day-trading."),
  bullet("The app is hosted on the web, so it works the same on your phone as on your computer — no install needed."),
  bullet("A high score means 'worth a closer look by the rules you chose,' not 'guaranteed winner.' Markets humble everyone."),
  note("Generated by scripts/gen-docs/user-guide.mjs."),
]);
