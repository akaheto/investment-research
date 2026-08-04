/**
 * E2 Calendar events endpoint.
 * TODO: Integrate with Fed calendar, earnings calendars, and macro event sources.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // TODO: Use symbols, startDate, endDate to filter calendar events
  req.nextUrl.searchParams.get("symbols")?.split(",");
  req.nextUrl.searchParams.get("startDate");
  req.nextUrl.searchParams.get("endDate");

  // TODO: Query calendar events from sources and cache in database
  const mockEvents = [
    {
      id: "1",
      title: "Apple Q4 Earnings",
      date: new Date("2026-08-15"),
      type: "earnings" as const,
      symbols: ["AAPL"],
      impact: "high" as const,
    },
    {
      id: "2",
      title: "Federal Reserve FOMC Meeting",
      date: new Date("2026-09-18"),
      type: "fed" as const,
      impact: "high" as const,
    },
    {
      id: "3",
      title: "US CPI Release",
      date: new Date("2026-08-20"),
      type: "economic" as const,
      impact: "medium" as const,
    },
  ];

  return NextResponse.json({ events: mockEvents });
}
