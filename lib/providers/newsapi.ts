/**
 * NewsAPI provider — financial & political headlines
 * Free tier: 100 requests/day
 * Docs: https://newsapi.org/
 */

import { logApiCall } from "@/lib/audit/tracker";

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export class NewsAPIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEWS_API_KEY || "";
  }

  async searchFinancialNews(query: string, limit = 20): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn("NEWS_API_KEY not set; returning empty news");
      return [];
    }

    const startTime = Date.now();
    try {
      const params = new URLSearchParams({
        q: query,
        sortBy: "publishedAt",
        language: "en",
        apiKey: this.apiKey,
      });

      const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
        headers: { "User-Agent": "Investment Research Dashboard" },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        console.error(`NewsAPI error: ${response.status}`);
        logApiCall({
          provider: "newsapi",
          endpoint: `/everything?q=${query}`,
          statusCode: response.status,
          durationMs: duration,
          error: `HTTP ${response.status}`,
        });
        return [];
      }

      const data: NewsAPIResponse = await response.json();
      logApiCall({
        provider: "newsapi",
        endpoint: `/everything?q=${query}`,
        statusCode: 200,
        durationMs: duration,
        recordsReturned: data.articles.length,
      });
      return data.articles.slice(0, limit);
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error("NewsAPI fetch failed:", err);
      logApiCall({
        provider: "newsapi",
        endpoint: `/everything?q=${query}`,
        durationMs: duration,
        error: String(err),
      });
      return [];
    }
  }

  async getTopHeadlines(category = "business"): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      console.warn("NEWS_API_KEY not set; returning empty news");
      return [];
    }

    try {
      const params = new URLSearchParams({
        category,
        country: "us",
        apiKey: this.apiKey,
      });

      const response = await fetch(`https://newsapi.org/v2/top-headlines?${params}`, {
        headers: { "User-Agent": "Investment Research Dashboard" },
      });

      if (!response.ok) {
        console.error(`NewsAPI error: ${response.status}`);
        return [];
      }

      const data: NewsAPIResponse = await response.json();
      return data.articles;
    } catch (err) {
      console.error("NewsAPI fetch failed:", err);
      return [];
    }
  }
}

export const newsApiProvider = new NewsAPIProvider();
