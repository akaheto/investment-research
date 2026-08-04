/**
 * E1 News headlines endpoint.
 * TODO: Integrate with SEC EDGAR RSS, Yahoo Finance news, and financial news APIs.
 * Returns headlines tagged with symbols and sentiment.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",");

  // TODO: Query news_items from database and apply sentiment/symbol tagging
  const mockHeadlines = [
    {
      id: "1",
      headline: "Apple Reports Strong iPhone Sales in Q3",
      source: "Bloomberg",
      publishedAt: new Date(Date.now() - 2 * 3600000),
      symbols: ["AAPL"],
      sentiment: "positive" as const,
    },
    {
      id: "2",
      headline: "Fed Signals Potential Rate Cut in September",
      source: "CNBC",
      publishedAt: new Date(Date.now() - 5 * 3600000),
      symbols: ["SPY", "QQQ"],
      sentiment: "positive" as const,
    },
    {
      id: "3",
      headline: "Tech Sector Faces Regulatory Headwinds",
      source: "Reuters",
      publishedAt: new Date(Date.now() - 24 * 3600000),
      symbols: ["MSFT", "GOOGL", "AAPL"],
      sentiment: "negative" as const,
    },
  ];

  const filtered = symbols ? mockHeadlines.filter((h) => h.symbols.some((s) => symbols.includes(s))) : mockHeadlines;

  return NextResponse.json({ headlines: filtered.slice(0, limit) });
}
