import { describe, it, expect } from "vitest";
import {
  computeValuationFactor,
  computeGrowthFactor,
  computeQualityFactor,
  computeMomentumFactor,
  computeAllFactors,
} from "./factors";
import { computeCompositeScore } from "./presets";
import type { RawMetrics } from "./types";

describe("Signal Engine", () => {
  const mockUniverse: RawMetrics[] = [
    { peRatio: 15, priceToBook: 1.5, fcfYield: 0.05, roe: 0.15, netMargin: 0.1, revenueGrowth: 0.1, earningsGrowth: 0.12, return12m: 0.2, return6m: 0.08, sectorId: "tech" },
    { peRatio: 20, priceToBook: 2.0, fcfYield: 0.04, roe: 0.18, netMargin: 0.12, revenueGrowth: 0.15, earningsGrowth: 0.2, return12m: 0.15, return6m: 0.05, sectorId: "tech" },
    { peRatio: 25, priceToBook: 2.5, fcfYield: 0.03, roe: 0.12, netMargin: 0.08, revenueGrowth: 0.08, earningsGrowth: 0.1, return12m: 0.1, return6m: -0.05, sectorId: "tech" },
  ];

  it("computes valuation factor", () => {
    const raw: RawMetrics = { peRatio: 18, priceToBook: 1.8, fcfYield: 0.045, sectorId: "tech" };
    const result = computeValuationFactor(raw, mockUniverse, "tech");
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.confidence).toBe("high");
  });

  it("computes growth factor", () => {
    const raw: RawMetrics = { revenueGrowth: 0.12, earningsGrowth: 0.15 };
    const result = computeGrowthFactor(raw, mockUniverse);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("computes quality factor", () => {
    const raw: RawMetrics = { roe: 0.16, netMargin: 0.11, fcfYield: 0.045, sectorId: "tech" };
    const result = computeQualityFactor(raw, mockUniverse, "tech");
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("computes momentum factor", () => {
    const raw: RawMetrics = { return12m: 0.18, return6m: 0.07 };
    const result = computeMomentumFactor(raw, mockUniverse);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles missing data gracefully", () => {
    const raw: RawMetrics = { peRatio: 18 };
    const result = computeValuationFactor(raw, mockUniverse, "tech");
    expect(result.confidence).toBe("medium");
  });

  it("computes composite score", () => {
    const raw: RawMetrics = {
      peRatio: 18,
      revenueGrowth: 0.12,
      roe: 0.16,
      return12m: 0.18,
      sectorId: "tech",
    };
    const factors = computeAllFactors(raw, mockUniverse, "tech");
    const composite = computeCompositeScore(factors, "balanced");
    expect(composite).toBeGreaterThan(0);
    expect(composite).toBeLessThanOrEqual(100);
  });

  it("applies preset weights correctly", () => {
    const factors = { valuation: 80, growth: 40, quality: 70, momentum: 60 };
    const balanced = computeCompositeScore(factors, "balanced");
    const value = computeCompositeScore(factors, "value");
    expect(value).toBeGreaterThan(balanced);
  });
});
