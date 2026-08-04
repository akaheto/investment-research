import { db } from "@/db/client";
import { newsItems } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryLimit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const items = await db
      .select()
      .from(newsItems)
      .orderBy(desc(newsItems.publishedAt))
      .limit(queryLimit);

    return Response.json({
      ok: true,
      count: items.length,
      headlines: items.map((item) => ({
        id: item.id,
        headline: item.title,
        source: item.source,
        url: item.url,
        publishedAt: new Date(item.publishedAt),
        symbols: item.tickersCsv?.split(",").map((s) => s.trim()) || [],
        sentiment: undefined, // TODO: Add sentiment analysis
      })),
    });
  } catch (error) {
    console.error("News API error:", error);
    return Response.json(
      { ok: false, error: String(error), headlines: [] },
      { status: 500 }
    );
  }
}
