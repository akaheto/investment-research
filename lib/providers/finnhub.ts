/**
 * Finnhub provider — company fundamentals, earnings, sentiment
 * Free tier: 60 requests/minute
 * Docs: https://finnhub.io/api/docs
 */

import type { FundamentalsProvider } from "./types";

export interface CompanyProfile {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  marketCapitalization: number;
  pe: number;
  pbv: number;
  dividendYield: number;
  eps: number;
  roe: number;
  roic: number;
  debt: number;
  currentRatio: number;
  description: string;
}

export interface FinnhubMetrics {
  symbol: string;
  peRatio: number;
  pbRatio: number;
  priceToSalesRatio: number;
  priceToCashFlowRatio: number;
  roe: number;
  roic: number;
  roe5y: number;
}

export interface EarningsData {
  symbol: string;
  actual?: number;
  estimate?: number;
  surprise?: number;
  surprisePercent?: number;
}

export class FinnhubProvider implements FundamentalsProvider {
  private apiKey: string;
  private baseUrl = "https://finnhub.io/api/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FINNHUB_API_KEY || "";
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    if (!this.apiKey) {
      console.warn("FINNHUB_API_KEY not set");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/stock/profile2?symbol=${symbol}&token=${this.apiKey}`
      );

      if (!response.ok) {
        console.error(`Finnhub error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        symbol: data.ticker || symbol,
        name: data.name || "",
        sector: data.finnhubIndustry || "",
        country: data.country || "",
        marketCapitalization: data.marketCapitalization || 0,
        pe: data.pe || 0,
        pbv: 0,
        dividendYield: 0,
        eps: 0,
        roe: 0,
        roic: 0,
        debt: 0,
        currentRatio: 0,
        description: data.description || "",
      };
    } catch (err) {
      console.error("Finnhub fetch failed:", err);
      return null;
    }
  }

  async getMetrics(symbol: string): Promise<FinnhubMetrics | null> {
    if (!this.apiKey) {
      console.warn("FINNHUB_API_KEY not set");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/stock/metric?symbol=${symbol}&metric=all&token=${this.apiKey}`
      );

      if (!response.ok) {
        console.error(`Finnhub metrics error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const metrics = data.metric || {};

      return {
        symbol,
        peRatio: metrics.pe || 0,
        pbRatio: metrics.pb || 0,
        priceToSalesRatio: metrics.ps || 0,
        priceToCashFlowRatio: metrics.pcf || 0,
        roe: metrics.roe || 0,
        roic: metrics.roic || 0,
        roe5y: metrics.roe5y || 0,
      };
    } catch (err) {
      console.error("Finnhub metrics fetch failed:", err);
      return null;
    }
  }

  async getEarningsEstimates(symbol: string): Promise<EarningsData | null> {
    if (!this.apiKey) {
      console.warn("FINNHUB_API_KEY not set");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/stock/earnings?symbol=${symbol}&token=${this.apiKey}`
      );

      if (!response.ok) {
        console.error(`Finnhub earnings error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const latest = data[0] || {};

      return {
        symbol,
        actual: latest.actual,
        estimate: latest.estimate,
        surprise: latest.surprise,
        surprisePercent: latest.surprisePercent,
      };
    } catch (err) {
      console.error("Finnhub earnings fetch failed:", err);
      return null;
    }
  }

  async getSentiment(symbol: string): Promise<{ sentiment: string; score: number } | null> {
    if (!this.apiKey) {
      console.warn("FINNHUB_API_KEY not set");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/stock/news-sentiment?symbol=${symbol}&token=${this.apiKey}`
      );

      if (!response.ok) {
        console.error(`Finnhub sentiment error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const sentiment = data.sentiment || "neutral";
      const score = sentiment === "positive" ? 1 : sentiment === "negative" ? -1 : 0;

      return { sentiment, score };
    } catch (err) {
      console.error("Finnhub sentiment fetch failed:", err);
      return null;
    }
  }
}

export const finnhubProvider = new FinnhubProvider();
