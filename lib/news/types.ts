export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  publishedAt: Date;
  symbols: string[];
  sentiment?: "positive" | "negative" | "neutral";
  summary?: string;
  url?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "earnings" | "fed" | "economic" | "market" | "other";
  symbols?: string[];
  impact: "high" | "medium" | "low";
}
