/**
 * E4: LLM narrative layer — Generate event-overlay narratives.
 * Takes deterministic Layer 1 assessment + cited events → Claude writes contextualized narrative.
 * TODO: Wire ANTHROPIC_API_KEY from environment.
 */

import type { AssessmentLayer1 } from "@/lib/portfolio/assessor";

export interface NewsEvent {
  id: string;
  headline: string;
  direction: "headwind" | "tailwind" | "watch";
  holdings: string[];
}

export interface NarrativeRequest {
  accountName: string;
  layer1: AssessmentLayer1;
  citedEvents: NewsEvent[];
}

/**
 * Generate event-overlay narrative using Claude.
 * TODO: Requires ANTHROPIC_API_KEY env var.
 */
export async function generateNarrative(req: NarrativeRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set; returning placeholder narrative");
    return placeholderNarrative(req);
  }

  try {
    const prompt = buildPrompt(req);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`);
      return placeholderNarrative(req);
    }

    const data = await response.json();
    const narrative = data.content[0]?.text || placeholderNarrative(req);

    return sanitizeNarrative(narrative);
  } catch (err) {
    console.error("Narrative generation failed:", err);
    return placeholderNarrative(req);
  }
}

/**
 * Build the prompt for Claude.
 */
function buildPrompt(req: NarrativeRequest): string {
  const eventsText = req.citedEvents
    .map((e) => `- "${e.headline}" (${e.direction} to ${e.holdings.join(", ")})`)
    .join("\n");

  return `You are a financial advisor writing a portfolio assessment narrative. Your job is to contextualize deterministic factor scores with recent events.

Portfolio: ${req.accountName}
Total Balance: $${req.layer1.totalBalance.toLocaleString()}
Annual Expenses: $${req.layer1.costDrag.annualCost.toFixed(2)} (${(req.layer1.expenseRatioBps / 100).toFixed(2)}%)

Recent Events:
${eventsText}

Write a 2-3 sentence narrative that:
1. Summarizes the portfolio's factor positioning (valuation: ${req.layer1.holdingScores[0]?.compositeScore ?? "N/A"})
2. Contexualizes it with the events above
3. Mentions specific holdings and events cited

RULE: Only mention events if they appear in the list above. Cite holdings by name in parentheses.
RULE: Do NOT fabricate events. Do NOT mention holdings not in the cited events.
RULE: Keep it concise and actionable.`;
}

/**
 * Ensure narrative only cites events in the approved list.
 * TODO: Add sophisticated sanitization to prevent event hallucinations.
 */
function sanitizeNarrative(text: string): string {
  return text.trim();
}

/**
 * Placeholder narrative when API unavailable.
 */
function placeholderNarrative(req: NarrativeRequest): string {
  const eventSummary = req.citedEvents.length > 0 ? `Recent developments (${req.citedEvents.map((e) => e.holdings.join("/")).join(", ")}) merit attention.` : "Monitor macro conditions.";

  return `Your ${req.accountName} portfolio spans ${req.layer1.holdingScores.length} funds with ${(req.layer1.expenseRatioBps / 100).toFixed(2)}% annual costs. ${eventSummary}`;
}
