/**
 * Composite score composer: combines factor scores with tunable weights.
 * Supports multiple scoring presets (Balanced, Value, Growth, Quality).
 */

import { FACTOR_METRICS, assessConfidence } from "./metrics";

export interface ScoringWeights {
  valuation: number;
  growth: number;
  quality: number;
  momentum: number;
}

export const PRESET_WEIGHTS: Record<string, ScoringWeights> = {
  balanced: { valuation: 0.25, growth: 0.25, quality: 0.25, momentum: 0.25 },
  value: { valuation: 0.4, growth: 0.15, quality: 0.3, momentum: 0.15 },
  growth: { valuation: 0.15, growth: 0.45, quality: 0.25, momentum: 0.15 },
  quality: { valuation: 0.15, growth: 0.25, quality: 0.45, momentum: 0.15 },
};

export interface CompositeScoreResult {
  compositeScore: number;
  factorScores: Record<string, number>;
  weights: ScoringWeights;
  confidence: "full" | "low";
  preset: string;
}

/**
 * Compute composite score from factor percentiles and weights
 */
export function computeCompositeScore(
  factorPercentiles: Record<string, number>,
  presetName: string = "balanced"
): CompositeScoreResult {
  const weights = PRESET_WEIGHTS[presetName] || PRESET_WEIGHTS["balanced"];
  const factors = Object.keys(FACTOR_METRICS);

  // Validate all factors have scores
  const allScores = factors.reduce((acc, factor) => {
    acc[factor] = factorPercentiles[factor] ?? 50;
    return acc;
  }, {} as Record<string, number>);

  // Compute weighted composite
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [factor, weight] of Object.entries(weights)) {
    weightedSum += (allScores[factor] || 50) * weight;
    totalWeight += weight;
  }

  const compositeScore = totalWeight > 0 ? weightedSum / totalWeight : 50;

  // Assess overall confidence
  const lowConfidenceFactors = factors.filter(
    (f) => assessConfidence(f, factorPercentiles) === "low"
  );
  const confidence = lowConfidenceFactors.length > 2 ? "low" : "full";

  return {
    compositeScore: Math.max(0, Math.min(100, compositeScore)),
    factorScores: allScores,
    weights,
    confidence,
    preset: presetName,
  };
}

/**
 * Suggest the best preset for an instrument based on its factor profile
 */
export function suggestBestPreset(
  factorPercentiles: Record<string, number>
): string {
  const val = factorPercentiles["valuation"] ?? 50;
  const grw = factorPercentiles["growth"] ?? 50;
  const qal = factorPercentiles["quality"] ?? 50;

  if (qal > 70) return "quality";
  if (grw > 70 && val < 40) return "growth";
  if (val > 70) return "value";
  return "balanced";
}
