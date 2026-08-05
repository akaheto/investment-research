"use server";

import { db } from "@/db/client";
import { newsNarratives, newsItems, instruments } from "@/db/schema";
import { eq, desc, lt } from "drizzle-orm";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface NarrativeSummary {
  id: number;
  instrumentId: number;
  symbol: string;
  narrative: string;
  generatedAt: string;
}

/**
 * Generate or retrieve narrative for an instrument
 */
export async function getNarrativeForInstrument(
  instrumentId: number,
): Promise<{ ok: boolean; narrative?: NarrativeSummary; message?: string }> {
  try {
    // Check if recent narrative exists (not expired)
    const now = new Date().toISOString();
    const existing = await db
      .select()
      .from(newsNarratives)
      .where(eq(newsNarratives.instrumentId, instrumentId))
      .orderBy(desc(newsNarratives.generatedAt))
      .limit(1);

    if (existing.length > 0 && existing[0].expiresAt > now) {
      // Return cached narrative
      const instrument = await db.select().from(instruments).where(eq(instruments.id, instrumentId)).limit(1);
      return {
        ok: true,
        narrative: {
          id: existing[0].id,
          instrumentId: existing[0].instrumentId,
          symbol: instrument[0]?.symbol || "UNKNOWN",
          narrative: existing[0].narrative,
          generatedAt: existing[0].generatedAt,
        },
      };
    }

    // Generate new narrative
    return await generateNarrative(instrumentId);
  } catch (error) {
    console.error("Error getting narrative:", error);
    return { ok: false, message: String(error) };
  }
}

/**
 * Generate narrative from recent news using Claude API
 */
export async function generateNarrative(instrumentId: number): Promise<{
  ok: boolean;
  narrative?: NarrativeSummary;
  message?: string;
}> {
  try {
    // Get instrument details
    const inst = await db.select().from(instruments).where(eq(instruments.id, instrumentId)).limit(1);
    if (inst.length === 0) {
      return { ok: false, message: "Instrument not found" };
    }

    const symbol = inst[0].symbol;

    // Get recent news (last 10 articles)
    const recentNews = await db
      .select({
        title: newsItems.title,
        source: newsItems.source,
        url: newsItems.url,
        publishedAt: newsItems.publishedAt,
      })
      .from(newsItems)
      .where(eq(newsItems.tickersCsv, symbol))
      .orderBy(desc(newsItems.publishedAt))
      .limit(10);

    if (recentNews.length === 0) {
      return {
        ok: true,
        narrative: {
          id: 0,
          instrumentId,
          symbol,
          narrative: `No recent news available for ${symbol}. Check back later for updates.`,
          generatedAt: new Date().toISOString(),
        },
        message: "No news available",
      };
    }

    // Format news for Claude
    const newsContext = recentNews
      .map((n) => `- ${n.title} (${n.source}, ${n.publishedAt})`)
      .join("\n");

    // Call Claude API to generate narrative
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: `You are an investment analyst. Generate a brief, neutral narrative (2-3 sentences) summarizing
recent developments for a company based on recent news headlines. Focus on factual business developments,
market trends, or events. Do NOT provide investment recommendations or score the company. Be objective and
informative, suitable for an investment research dashboard.`,
      messages: [
        {
          role: "user",
          content: `Generate a narrative summary for ${symbol} based on these recent news headlines:\n\n${newsContext}`,
        },
      ],
    });

    const narrative =
      message.content[0].type === "text"
        ? message.content[0].text
        : `Analysis unavailable for ${symbol}`;

    // Store in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day TTL

    const result = await db
      .insert(newsNarratives)
      .values({
        instrumentId,
        narrative,
        recentHeadlines: JSON.stringify(recentNews.map((n) => n.title)),
        generatedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      })
      .returning();

    console.log(`✓ Generated narrative for ${symbol}`);
    return {
      ok: true,
      narrative: {
        id: result[0].id,
        instrumentId,
        symbol,
        narrative,
        generatedAt: result[0].generatedAt,
      },
    };
  } catch (error) {
    console.error("Error generating narrative:", error);
    return { ok: false, message: String(error) };
  }
}

/**
 * Generate narratives for all watchlist instruments
 */
export async function generateNarrativesForWatchlist(): Promise<{
  ok: boolean;
  count?: number;
  message?: string;
}> {
  try {
    // Get all watchlist instruments
    const { watchlist } = await import("@/db/schema");

    const allWatchlistItems = await db.select().from(watchlist);
    const uniqueIds = Array.from(new Set(allWatchlistItems.map((w) => w.instrumentId)));

    let count = 0;
    for (const instrumentId of uniqueIds) {
      const result = await generateNarrative(instrumentId);
      if (result.ok) count++;
    }

    console.log(`✓ Generated ${count} narratives`);
    return { ok: true, count, message: `Generated narratives for ${count} instruments` };
  } catch (error) {
    console.error("Error generating watchlist narratives:", error);
    return { ok: false, message: String(error) };
  }
}

/**
 * Delete expired narratives
 */
export async function cleanupExpiredNarratives(): Promise<{ ok: boolean; deleted?: number }> {
  try {
    const now = new Date().toISOString();
    await db.delete(newsNarratives).where(lt(newsNarratives.expiresAt, now));
    return { ok: true, deleted: 0 };
  } catch (error) {
    console.error("Error cleaning up narratives:", error);
    return { ok: false };
  }
}
