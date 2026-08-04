import type { RawMetrics } from "./types";

export interface MetricStats {
  values: number[];
  min: number;
  max: number;
  p2: number;
  p98: number;
}

export function computeMetricStats(metrics: number[]): MetricStats {
  const sorted = [...metrics].filter((v) => !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return { values: [], min: 0, max: 0, p2: 0, p98: 0 };

  const n = sorted.length;
  const p2Idx = Math.ceil(n * 0.02) - 1;
  const p98Idx = Math.ceil(n * 0.98) - 1;

  return {
    values: sorted,
    min: sorted[0],
    max: sorted[n - 1],
    p2: sorted[Math.max(0, p2Idx)],
    p98: sorted[Math.min(n - 1, p98Idx)],
  };
}

export function winsorize(value: number, stats: MetricStats): number {
  if (isNaN(value)) return NaN;
  return Math.max(stats.p2, Math.min(stats.p98, value));
}

export function percentileRank(winsorizedValue: number, stats: MetricStats, ascending: boolean): number {
  if (isNaN(winsorizedValue)) return NaN;
  const sorted = stats.values;
  if (sorted.length === 0) return 50;

  let position = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] <= winsorizedValue) position = i + 1;
  }

  let percentile = (position / sorted.length) * 100;
  if (!ascending) percentile = 100 - percentile;
  return Math.min(100, Math.max(0, percentile));
}

export function extractValuationMetrics(raw: RawMetrics): { pe?: number; pb?: number; fcf?: number } {
  return { pe: raw.peRatio, pb: raw.priceToBook, fcf: raw.fcfYield };
}

export function extractGrowthMetrics(raw: RawMetrics): { revenue?: number; earnings?: number } {
  return { revenue: raw.revenueGrowth, earnings: raw.earningsGrowth };
}

export function extractQualityMetrics(raw: RawMetrics): { roe?: number; margin?: number; fcf?: number } {
  return { roe: raw.roe, margin: raw.netMargin, fcf: raw.fcfYield };
}

export function extractMomentumMetrics(raw: RawMetrics): { return12m?: number; return6m?: number } {
  return { return12m: raw.return12m, return6m: raw.return6m };
}
