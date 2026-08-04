/**
 * Factor metrics computation and normalization.
 * Computes raw scores from fundamentals, then normalizes to 0-100 percentile scale.
 *
 * Key principle: winsorize outliers (cap at 5th/95th percentile), then rank.
 * This ensures new instruments with extreme values don't skew percentile scores.
 */

export interface MetricScore {
  metric: string;
  rawValue: number;
  percentile: number;
  direction: "higher_is_better" | "lower_is_better";
}

// Thresholds for winsorizing (5th/95th percentile across historical data)
const WINSORIZE_BOUNDS: Record<string, [number, number]> = {
  pe_ttm: [8, 50],
  pb: [0.5, 8],
  debt_equity: [0, 3],
  roe: [0, 0.4],
  fcf_yield: [0, 0.2],
  gross_margin: [0.1, 0.9],
  net_margin: [-0.1, 0.4],
  dividend_yield: [0, 0.08],
  revenue_growth: [-0.3, 1],
  earnings_growth: [-1, 1],
  fcf_growth: [-1, 2],
};

/**
 * Winsorize a value: cap outliers at bounds
 */
function winsorize(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert raw value to percentile rank (0-100).
 * Assumes values have been pre-winsorized.
 * For "higher is better": higher values get higher percentiles.
 * For "lower is better": lower values get higher percentiles.
 */
function rankToPercentile(
  rawValue: number,
  allValues: number[],
  direction: "higher_is_better" | "lower_is_better"
): number {
  if (allValues.length === 0) return 50;

  const sorted = [...allValues].sort((a, b) => a - b);
  const rank = sorted.filter((v) => v <= rawValue).length;

  // Percentile: (rank / total) * 100
  let percentile = (rank / sorted.length) * 100;

  if (direction === "lower_is_better") {
    percentile = 100 - percentile;
  }

  return Math.max(0, Math.min(100, percentile));
}

/**
 * Compute a single factor metric from raw fundamental value.
 * Returns the percentile score (0-100).
 */
export function computeMetricPercentile(
  metric: string,
  rawValue: number,
  allInstruments: Array<{ symbol: string; fundamentals: Record<string, number> }>
): MetricScore {
  const direction =
    [
      "roe",
      "gross_margin",
      "net_margin",
      "fcf_yield",
      "dividend_yield",
      "revenue_growth",
      "earnings_growth",
      "fcf_growth",
    ].includes(metric) ? "higher_is_better" : "lower_is_better";

  const [min, max] = WINSORIZE_BOUNDS[metric] || [0, 100];
  const winsorized = winsorize(rawValue, min, max);

  // Collect all values for this metric across instruments
  const allMetricValues = allInstruments
    .map((instr) => instr.fundamentals[metric])
    .filter((v) => v !== undefined && !isNaN(v))
    .map((v) => winsorize(v, min, max));

  const percentile = rankToPercentile(winsorized, allMetricValues, direction);

  return {
    metric,
    rawValue,
    percentile,
    direction,
  };
}

/**
 * Factor definitions: which metrics roll up into which factors
 */
export const FACTOR_METRICS: Record<string, { metrics: string[]; description: string }> = {
  valuation: {
    metrics: ["pe_ttm", "pb", "dividend_yield"],
    description: "Price multiples and dividend",
  },
  growth: {
    metrics: ["revenue_growth", "earnings_growth", "fcf_growth"],
    description: "Growth rates",
  },
  quality: {
    metrics: ["roe", "gross_margin", "net_margin"],
    description: "Profitability and returns",
  },
  momentum: {
    metrics: ["earnings_growth", "fcf_growth"],
    description: "Recent growth acceleration",
  },
};

/**
 * Compute factor score by averaging percentiles of constituent metrics
 */
export function computeFactorScore(
  factor: string,
  metricPercentiles: Record<string, number>
): number {
  const def = FACTOR_METRICS[factor];
  if (!def) return 50;

  const scores = def.metrics
    .map((m) => metricPercentiles[m])
    .filter((s) => s !== undefined);

  if (scores.length === 0) return 50;

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Confidence level: did we have enough data?
 * "full" = >= 50% of metrics available, "low" = < 50%
 */
export function assessConfidence(
  factor: string,
  metricPercentiles: Record<string, number>
): "full" | "low" {
  const def = FACTOR_METRICS[factor];
  if (!def) return "full";

  const available = def.metrics.filter((m) => metricPercentiles[m] !== undefined).length;
  return available / def.metrics.length >= 0.5 ? "full" : "low";
}
