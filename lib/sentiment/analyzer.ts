/**
 * Simple sentiment analyzer for news headlines.
 * Keyword-based approach for production reliability.
 */

const POSITIVE_KEYWORDS = [
  "beat",
  "rally",
  "surge",
  "soars",
  "outperform",
  "strong",
  "growth",
  "profit",
  "gain",
  "bullish",
  "optimistic",
  "upgrade",
  "beat estimates",
  "raises",
  "expansion",
  "record",
  "breakout",
];

const NEGATIVE_KEYWORDS = [
  "miss",
  "plunge",
  "crash",
  "tumble",
  "downgrade",
  "weak",
  "decline",
  "loss",
  "concern",
  "bearish",
  "pessimistic",
  "warning",
  "downside",
  "recession",
  "default",
  "bankruptcy",
];

export type Sentiment = "positive" | "negative" | "neutral";

export function analyzeSentiment(text: string): { sentiment: Sentiment; confidence: number } {
  if (!text) return { sentiment: "neutral", confidence: 0 };

  const lower = text.toLowerCase();
  const positiveMatches = POSITIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;

  const total = positiveMatches + negativeMatches;
  if (total === 0) return { sentiment: "neutral", confidence: 0 };

  const positive = positiveMatches / total > 0.5;
  const confidence = Math.min(1, total / 5); // Max confidence with 5+ keywords

  if (positive) {
    return { sentiment: "positive", confidence };
  } else {
    return { sentiment: "negative", confidence };
  }
}

export function sentimentIcon(sentiment?: Sentiment): string {
  return sentiment === "positive" ? "📈" : sentiment === "negative" ? "📉" : "📰";
}
