"use server";

import { db } from "@/db/client";
import { events } from "@/db/schema";
import { desc, gte } from "drizzle-orm";

export interface EventSummary {
  id: number;
  eventDate: string;
  eventType: string;
  title: string;
  description: string | null | undefined;
  impactDirection: string | null | undefined;
  source: string | null | undefined;
  url: string | null | undefined;
}

/**
 * Get upcoming events for the next N days
 */
export async function getUpcomingEvents(daysAhead: number = 30): Promise<EventSummary[]> {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const results = await db
    .select({
      id: events.id,
      eventDate: events.eventDate,
      eventType: events.eventType,
      title: events.title,
      description: events.description,
      impactDirection: events.impactDirection,
      source: events.source,
      url: events.url,
    })
    .from(events)
    .where(gte(events.eventDate, today))
    .orderBy(events.eventDate);

  return results.filter((e) => e.eventDate <= futureDateStr);
}

/**
 * Get events by type
 */
export async function getEventsByType(eventType: string, daysAhead: number = 30): Promise<EventSummary[]> {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const results = await db
    .select({
      id: events.id,
      eventDate: events.eventDate,
      eventType: events.eventType,
      title: events.title,
      description: events.description,
      impactDirection: events.impactDirection,
      source: events.source,
      url: events.url,
    })
    .from(events)
    .where(gte(events.eventDate, today))
    .orderBy(events.eventDate);

  return results.filter((e) => e.eventType === eventType && e.eventDate <= futureDateStr);
}

/**
 * Add an event
 */
export async function addEvent(
  eventDate: string,
  eventType: string,
  title: string,
  description?: string,
  impactDirection?: string,
  source?: string,
  url?: string,
  instrumentId?: number,
): Promise<{ ok: boolean; id?: number; error?: string }> {
  try {
    const result = await db
      .insert(events)
      .values({
        eventDate,
        eventType,
        title,
        description,
        impactDirection,
        source,
        url,
        instrumentId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return { ok: true, id: result[0].id };
  } catch (error) {
    console.error("Failed to add event:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Initialize FOMC and CPI events for the next 12 months
 */
export async function initializeEconomicCalendar(): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    // FOMC meetings for 2026-2027 (approximate dates - 8 per year)
    const fomcDates = [
      "2026-01-27",
      "2026-03-17",
      "2026-05-04",
      "2026-06-16",
      "2026-07-28",
      "2026-09-15",
      "2026-11-03",
      "2026-12-15",
      "2027-01-26",
      "2027-03-16",
      "2027-05-04",
    ];

    // CPI releases (monthly, typically 2nd week)
    const cpiDates = [];
    for (let month = 0; month < 12; month++) {
      const date = new Date(now.getFullYear(), now.getMonth() + month, 12);
      if (date <= nextYear) {
        cpiDates.push(date.toISOString().split("T")[0]);
      }
    }

    let count = 0;

    // Insert FOMC dates
    for (const date of fomcDates) {
      if (new Date(date) >= now && new Date(date) <= nextYear) {
        try {
          await db
            .insert(events)
            .values({
              eventDate: date,
              eventType: "fomc_meeting",
              title: "FOMC Meeting",
              description: "Federal Open Market Committee meeting",
              source: "fed",
              impactDirection: "neutral",
              createdAt: new Date().toISOString(),
            })
            .onConflictDoNothing();
          count++;
        } catch {
          // Ignore duplicates
        }
      }
    }

    // Insert CPI dates
    for (const date of cpiDates) {
      try {
        await db
          .insert(events)
          .values({
            eventDate: date,
            eventType: "cpi_release",
            title: "CPI Release",
            description: "Consumer Price Index (inflation) release",
            source: "bls",
            impactDirection: "neutral",
            createdAt: new Date().toISOString(),
          })
          .onConflictDoNothing();
        count++;
      } catch {
        // Ignore duplicates
      }
    }

    console.log(`✓ Initialized ${count} economic calendar events`);
    return { ok: true, count };
  } catch (error) {
    console.error("Failed to initialize calendar:", error);
    return { ok: false, error: String(error) };
  }
}
