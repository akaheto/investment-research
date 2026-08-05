"use server";

/**
 * Research: content authored outside the dashboard (a script, a Claude
 * session, an API feed) and displayed here. No UI form adds entries —
 * createResearchItem() is the write path for whatever process feeds this.
 */

import { db } from "@/db/client";
import { researchItems } from "@/db/schema";
import { desc } from "drizzle-orm";

export interface ResearchItem {
  id: number;
  title: string;
  publishedAt: string;
  body: string;
}

export async function getResearchItems(): Promise<ResearchItem[]> {
  try {
    return await db.select().from(researchItems).orderBy(desc(researchItems.publishedAt));
  } catch (error) {
    console.error("❌ Failed to load research items:", error);
    return [];
  }
}

export async function createResearchItem(input: {
  title: string;
  body: string;
  publishedAt?: string;
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  try {
    const result = await db
      .insert(researchItems)
      .values({
        title: input.title,
        body: input.body,
        publishedAt: input.publishedAt ?? new Date().toISOString(),
      })
      .returning();
    return { ok: true, id: result[0].id };
  } catch (error) {
    console.error("❌ Failed to create research item:", error);
    return { ok: false, error: String(error) };
  }
}
