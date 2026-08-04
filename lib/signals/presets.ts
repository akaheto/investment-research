import type { FactorScore, ScoringPreset } from "./types";

export const PRESETS: Record<string, ScoringPreset> = {
  balanced: {
    name: "Balanced",
    weights: { valuation: 0.25, growth: 0.25, quality: 0.25, momentum: 0.25 },
  },
  value: {
    name: "Value",
    weights: { valuation: 0.4, growth: 0.15, quality: 0.3, momentum: 0.15 },
  },
  growth: {
    name: "Growth",
    weights: { valuation: 0.15, growth: 0.4, quality: 0.25, momentum: 0.2 },
  },
  quality: {
    name: "Quality",
    weights: { valuation: 0.2, growth: 0.2, quality: 0.45, momentum: 0.15 },
  },
};

export function computeCompositeScore(factors: FactorScore, presetKey: string = "balanced"): number {
  const preset = PRESETS[presetKey] || PRESETS.balanced;
  const { weights } = preset;
  const composite =
    factors.valuation * weights.valuation +
    factors.growth * weights.growth +
    factors.quality * weights.quality +
    factors.momentum * weights.momentum;

  return Math.min(100, Math.max(0, composite));
}

export function getPresetName(presetKey: string): string {
  return PRESETS[presetKey]?.name || "Balanced";
}
