/**
 * Alpha Vantage provider — technical indicators & market sentiment
 * Free tier: 5 requests/minute (429 backoff retry recommended)
 * Docs: https://www.alphavantage.co/documentation/
 */

export interface RSIData {
  symbol: string;
  rsi: number;
  strength: "overbought" | "oversold" | "neutral";
}

export interface MACDData {
  symbol: string;
  macd: number;
  macdSignal: number;
  macdHist: number;
  signal: "bullish" | "bearish" | "neutral";
}

export interface VolumeAnalysis {
  symbol: string;
  currentVolume: number;
  avgVolume: number;
  volumeRatio: number;
}

export class AlphaVantageProvider {
  private apiKey: string;
  private baseUrl = "https://www.alphavantage.co/query";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALPHAVANTAGE_API_KEY || "";
  }

  private async fetchWithBackoff(
    url: string,
    retries = 3,
    delay = 1000
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
            continue;
          }
        }

        return response;
      } catch (err) {
        lastError = err as Error;
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError || new Error("Failed to fetch from Alpha Vantage");
  }

  async getRSI(symbol: string): Promise<RSIData | null> {
    if (!this.apiKey) {
      console.warn("ALPHAVANTAGE_API_KEY not set");
      return null;
    }

    try {
      const url = `${this.baseUrl}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&apikey=${this.apiKey}`;
      const response = await this.fetchWithBackoff(url);

      if (!response.ok) {
        console.error(`Alpha Vantage error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data["Error Message"] || !data["Technical Analysis: RSI"]) {
        return null;
      }

      const latest = Object.values(data["Technical Analysis: RSI"])[0] as
        | { RSI: string }
        | undefined;
      const rsi = latest ? parseFloat(latest.RSI) : 50;

      return {
        symbol,
        rsi,
        strength:
          rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral",
      };
    } catch (err) {
      console.error("Alpha Vantage RSI fetch failed:", err);
      return null;
    }
  }

  async getMACD(symbol: string): Promise<MACDData | null> {
    if (!this.apiKey) {
      console.warn("ALPHAVANTAGE_API_KEY not set");
      return null;
    }

    try {
      const url = `${this.baseUrl}?function=MACD&symbol=${symbol}&interval=daily&apikey=${this.apiKey}`;
      const response = await this.fetchWithBackoff(url);

      if (!response.ok) {
        console.error(`Alpha Vantage error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data["Error Message"] || !data["Technical Analysis: MACD"]) {
        return null;
      }

      const latest = Object.values(data["Technical Analysis: MACD"])[0] as
        | { MACD: string; MACD_Signal: string; MACD_Hist: string }
        | undefined;

      if (!latest) return null;

      const macd = parseFloat(latest.MACD);
      const macdSignal = parseFloat(latest.MACD_Signal);
      const macdHist = parseFloat(latest.MACD_Hist);

      return {
        symbol,
        macd,
        macdSignal,
        macdHist,
        signal: macdHist > 0 ? "bullish" : macdHist < 0 ? "bearish" : "neutral",
      };
    } catch (err) {
      console.error("Alpha Vantage MACD fetch failed:", err);
      return null;
    }
  }

  async getVolumeAnalysis(symbol: string): Promise<VolumeAnalysis | null> {
    if (!this.apiKey) {
      console.warn("ALPHAVANTAGE_API_KEY not set");
      return null;
    }

    try {
      const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await this.fetchWithBackoff(url);

      if (!response.ok) {
        console.error(`Alpha Vantage error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data["Error Message"] || !data["Time Series (Daily)"]) {
        return null;
      }

      const timeSeries = Object.entries(data["Time Series (Daily)"])
        .slice(0, 20)
        .map(([, v]) => parseFloat((v as { volume: string }).volume));

      const currentVolume = timeSeries[0] || 0;
      const avgVolume = timeSeries.reduce((a, b) => a + b, 0) / timeSeries.length;

      return {
        symbol,
        currentVolume,
        avgVolume,
        volumeRatio: avgVolume > 0 ? currentVolume / avgVolume : 0,
      };
    } catch (err) {
      console.error("Alpha Vantage volume fetch failed:", err);
      return null;
    }
  }
}

export const alphaVantageProvider = new AlphaVantageProvider();
