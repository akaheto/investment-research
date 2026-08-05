"use server";

import { db } from "@/db/client";
import { accounts, fundHoldings, funds, events, assessments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Anthropic } from "@anthropic-ai/sdk";

interface EventImpactAssessment {
  accountId: number;
  accountName: string;
  totalBalance: number;
  upcomingEventsCount: number;
  riskLevel: "low" | "moderate" | "high";
  narrative: string;
  citedEventIds: number[];
  generatedAt: string;
}

/**
 * Assess how upcoming market events could impact a portfolio
 * Uses Claude to provide intelligent, narrative analysis
 */
export async function assessEventImpactForAccount(
  accountId: number,
  daysAhead: number = 30
): Promise<{
  ok: boolean;
  assessment?: EventImpactAssessment;
  message?: string;
}> {
  try {
    // Get account details
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (account.length === 0) {
      return { ok: false, message: "Account not found" };
    }

    // Get account holdings
    const holdings = await db
      .select()
      .from(fundHoldings)
      .where(eq(fundHoldings.accountId, accountId));

    if (holdings.length === 0) {
      return { ok: false, message: "No holdings found for account" };
    }

    // Get fund details for holdings
    const fundDetails = await db.select().from(funds);
    const fundMap = new Map(fundDetails.map((f) => [f.id, f]));

    // Build holdings summary
    const holdingsSummary = holdings
      .map((h) => {
        const fund = fundMap.get(h.fundId);
        return fund
          ? `${fund.fundName}: ${h.allocationPercent.toFixed(1)}% ($${(h.balanceAmount / 1000).toFixed(0)}k)`
          : null;
      })
      .filter((s): s is string => s !== null);

    const totalBalance = holdings.reduce((sum, h) => sum + h.balanceAmount, 0);

    // Get upcoming events (next N days)
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Get all events and filter in memory (simpler than complex SQL date comparisons)
    const allEvents = await db.select().from(events);
    const upcomingEvents = allEvents.filter((e) => e.eventDate >= today && e.eventDate <= futureDate);

    if (upcomingEvents.length === 0) {
      return {
        ok: true,
        assessment: {
          accountId,
          accountName: account[0].name,
          totalBalance,
          upcomingEventsCount: 0,
          riskLevel: "low",
          narrative: "No significant market events scheduled for the next 30 days.",
          citedEventIds: [],
          generatedAt: new Date().toISOString(),
        },
      };
    }

    // Build events summary
    const eventsSummary = upcomingEvents
      .map((e) => `${e.eventDate} - ${e.eventType}: ${e.title}`)
      .join("\n");

    // Call Claude to assess impact
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 400,
      system: `You are an investment analyst. Analyze upcoming market events and their potential impact on a portfolio.
Be concise, practical, and focus on specific holdings mentioned. Assess risk level as low/moderate/high.
Keep response under 300 words.`,
      messages: [
        {
          role: "user",
          content: `Portfolio ($${(totalBalance / 1000).toFixed(0)}k):
${holdingsSummary.join("\n")}

Upcoming events (next 30 days):
${eventsSummary}

How might these events impact this portfolio? What should the investor watch for?`,
        },
      ],
    });

    // Extract narrative from response
    const narrative =
      response.content[0].type === "text"
        ? response.content[0].text
        : "Unable to generate assessment.";

    // Determine risk level based on event types
    const hasSignificantEvent = upcomingEvents.some((e) => ["fomc_meeting", "earnings"].includes(e.eventType));
    const riskLevel: "low" | "moderate" | "high" = hasSignificantEvent ? "moderate" : "low";

    const citedEventIds = upcomingEvents.map((e) => e.id);

    // Store assessment in database
    const assessment: EventImpactAssessment = {
      accountId,
      accountName: account[0].name,
      totalBalance,
      upcomingEventsCount: upcomingEvents.length,
      riskLevel,
      narrative,
      citedEventIds,
      generatedAt: new Date().toISOString(),
    };

    await db
      .insert(assessments)
      .values({
        accountId,
        runAt: assessment.generatedAt,
        deterministicJson: JSON.stringify({
          totalBalance,
          holdingCount: holdings.length,
          eventCount: upcomingEvents.length,
          riskLevel,
        }),
        narrativeText: narrative,
        citedEventIdsCsv: citedEventIds.join(","),
        modelId: "claude-sonnet-5",
      })
      .onConflictDoNothing();

    return { ok: true, assessment };
  } catch (error) {
    console.error("Failed to assess event impact:", error);
    return { ok: false, message: String(error) };
  }
}

/**
 * Get the latest assessment for an account
 */
export async function getLatestAssessmentForAccount(accountId: number): Promise<EventImpactAssessment | null> {
  try {
    const latest = await db
      .select()
      .from(assessments)
      .where(eq(assessments.accountId, accountId))
      .orderBy(desc(assessments.runAt))
      .limit(1);

    if (latest.length === 0) {
      return null;
    }

    const assessment = latest[0];
    const citedEventIds = assessment.citedEventIdsCsv
      ? assessment.citedEventIdsCsv.split(",").map(Number)
      : [];

    // Parse deterministic JSON
    const deterministicData = JSON.parse(assessment.deterministicJson || "{}");

    // Get account name
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    return {
      accountId,
      accountName: account[0]?.name || "Unknown",
      totalBalance: deterministicData.totalBalance || 0,
      upcomingEventsCount: deterministicData.eventCount || 0,
      riskLevel: deterministicData.riskLevel || "low",
      narrative: assessment.narrativeText || "",
      citedEventIds,
      generatedAt: assessment.runAt,
    };
  } catch (error) {
    console.error("Failed to get assessment:", error);
    return null;
  }
}
