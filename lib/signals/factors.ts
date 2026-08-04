import type { RawMetrics, FactorScore } from "./types";
import {
  extractValuationMetrics,
  extractGrowthMetrics,
  extractQualityMetrics,
  extractMomentumMetrics,
  computeMetricStats,
  winsorize,
  percentileRank,
} from "./metrics";

interface FactorResult {
  score: number;
  percentiles: Record<string, number>;
  confidence: "high" | "medium" | "low";
}

export function computeValuationFactor(
  raw: RawMetrics,
  universe: RawMetrics[],
  sector?: string
): FactorResult {
  const metrics = extractValuationMetrics(raw);
  const comparableUniverse = sector ? universe.filter((u) => u.sectorId === sector) : universe;

  const results: Record<string, number> = {};
  let validCount = 0;

  if (metrics.pe !== undefined && comparableUniverse.some((u) => u.peRatio !== undefined)) {
    const peValues = comparableUniverse.map((u) => u.peRatio).filter((v) => v !== undefined) as number[];
    const peStats = computeMetricStats(peValues);
    const winsorized = winsorize(metrics.pe, peStats);
    results.pe = percentileRank(winsorized, peStats, true);
    validCount++;
  }

  if (metrics.pb !== undefined && comparableUniverse.some((u) => u.priceToBook !== undefined)) {
    const pbValues = comparableUniverse.map((u) => u.priceToBook).filter((v) => v !== undefined) as number[];
    const pbStats = computeMetricStats(pbValues);
    const winsorized = winsorize(metrics.pb, pbStats);
    results.pb = percentileRank(winsorized, pbStats, true);
    validCount++;
  }

  if (metrics.fcf !== undefined && comparableUniverse.some((u) => u.fcfYield !== undefined)) {
    const fcfValues = comparableUniverse.map((u) => u.fcfYield).filter((v) => v !== undefined) as number[];
    const fcfStats = computeMetricStats(fcfValues);
    const winsorized = winsorize(metrics.fcf, fcfStats);
    results.fcf = percentileRank(winsorized, fcfStats, false);
    validCount++;
  }

  const score =
    validCount > 0
      ? Object.values(results).reduce((a, b) => a + b, 0) / validCount
      : 50;

  const confidence = validCount >= 2 ? "high" : validCount === 1 ? "medium" : "low";

  return { score, percentiles: results, confidence };
}

export function computeGrowthFactor(raw: RawMetrics, universe: RawMetrics[]): FactorResult {
  const metrics = extractGrowthMetrics(raw);
  const results: Record<string, number> = {};
  let validCount = 0;

  if (metrics.revenue !== undefined && universe.some((u) => u.revenueGrowth !== undefined)) {
    const revValues = universe.map((u) => u.revenueGrowth).filter((v) => v !== undefined) as number[];
    const revStats = computeMetricStats(revValues);
    const winsorized = winsorize(metrics.revenue, revStats);
    results.revenue = percentileRank(winsorized, revStats, false);
    validCount++;
  }

  if (metrics.earnings !== undefined && universe.some((u) => u.earningsGrowth !== undefined)) {
    const earValues = universe.map((u) => u.earningsGrowth).filter((v) => v !== undefined) as number[];
    const earStats = computeMetricStats(earValues);
    const winsorized = winsorize(metrics.earnings, earStats);
    results.earnings = percentileRank(winsorized, earStats, false);
    validCount++;
  }

  const score =
    validCount > 0
      ? Object.values(results).reduce((a, b) => a + b, 0) / validCount
      : 50;

  const confidence = validCount >= 2 ? "high" : validCount === 1 ? "medium" : "low";

  return { score, percentiles: results, confidence };
}

export function computeQualityFactor(
  raw: RawMetrics,
  universe: RawMetrics[],
  sector?: string
): FactorResult {
  const metrics = extractQualityMetrics(raw);
  const comparableUniverse = sector ? universe.filter((u) => u.sectorId === sector) : universe;
  const results: Record<string, number> = {};
  let validCount = 0;

  if (metrics.roe !== undefined && comparableUniverse.some((u) => u.roe !== undefined)) {
    const roeValues = comparableUniverse.map((u) => u.roe).filter((v) => v !== undefined) as number[];
    const roeStats = computeMetricStats(roeValues);
    const winsorized = winsorize(metrics.roe, roeStats);
    results.roe = percentileRank(winsorized, roeStats, false);
    validCount++;
  }

  if (metrics.margin !== undefined && comparableUniverse.some((u) => u.netMargin !== undefined)) {
    const marginValues = comparableUniverse.map((u) => u.netMargin).filter((v) => v !== undefined) as number[];
    const marginStats = computeMetricStats(marginValues);
    const winsorized = winsorize(metrics.margin, marginStats);
    results.margin = percentileRank(winsorized, marginStats, false);
    validCount++;
  }

  if (metrics.fcf !== undefined && comparableUniverse.some((u) => u.fcfYield !== undefined)) {
    const fcfValues = comparableUniverse.map((u) => u.fcfYield).filter((v) => v !== undefined) as number[];
    const fcfStats = computeMetricStats(fcfValues);
    const winsorized = winsorize(metrics.fcf, fcfStats);
    results.fcf = percentileRank(winsorized, fcfStats, false);
    validCount++;
  }

  const score =
    validCount > 0
      ? Object.values(results).reduce((a, b) => a + b, 0) / validCount
      : 50;

  const confidence = validCount >= 2 ? "high" : validCount === 1 ? "medium" : "low";

  return { score, percentiles: results, confidence };
}

export function computeMomentumFactor(raw: RawMetrics, universe: RawMetrics[]): FactorResult {
  const metrics = extractMomentumMetrics(raw);
  const results: Record<string, number> = {};
  let validCount = 0;

  if (metrics.return12m !== undefined && universe.some((u) => u.return12m !== undefined)) {
    const ret12mValues = universe.map((u) => u.return12m).filter((v) => v !== undefined) as number[];
    const ret12mStats = computeMetricStats(ret12mValues);
    const winsorized = winsorize(metrics.return12m, ret12mStats);
    results.return12m = percentileRank(winsorized, ret12mStats, false);
    validCount++;
  }

  if (metrics.return6m !== undefined && universe.some((u) => u.return6m !== undefined)) {
    const ret6mValues = universe.map((u) => u.return6m).filter((v) => v !== undefined) as number[];
    const ret6mStats = computeMetricStats(ret6mValues);
    const winsorized = winsorize(metrics.return6m, ret6mStats);
    results.return6m = percentileRank(winsorized, ret6mStats, false);
    validCount++;
  }

  const score =
    validCount > 0
      ? Object.values(results).reduce((a, b) => a + b, 0) / validCount
      : 50;

  const confidence = validCount >= 2 ? "high" : validCount === 1 ? "medium" : "low";

  return { score, percentiles: results, confidence };
}

export function computeAllFactors(raw: RawMetrics, universe: RawMetrics[], sector?: string): FactorScore {
  return {
    valuation: computeValuationFactor(raw, universe, sector).score,
    growth: computeGrowthFactor(raw, universe).score,
    quality: computeQualityFactor(raw, universe, sector).score,
    momentum: computeMomentumFactor(raw, universe).score,
  };
}
