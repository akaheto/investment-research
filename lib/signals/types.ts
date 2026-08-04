export interface RawMetrics {
  peRatio?: number;
  priceToBook?: number;
  debtToEquity?: number;
  roe?: number;
  fcfYield?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  netMargin?: number;
  return12m?: number;
  return6m?: number;
  sectorId?: string;
}

export interface FactorScore {
  valuation: number;
  growth: number;
  quality: number;
  momentum: number;
}

export interface CompositeScoreInput {
  valuation: number;
  growth: number;
  quality: number;
  momentum: number;
  weights?: { valuation: number; growth: number; quality: number; momentum: number };
}

export interface ScoreDecomposition {
  factorScores: FactorScore;
  compositeScore: number;
  preset: string;
  weights: { valuation: number; growth: number; quality: number; momentum: number };
  confidence: "high" | "medium" | "low";
  metrics: Record<string, { raw: number; winsorized: number; percentile: number }>;
}

export interface ScoringPreset {
  name: string;
  weights: { valuation: number; growth: number; quality: number; momentum: number };
}
