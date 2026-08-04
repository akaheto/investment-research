import { describe, expect, it } from "vitest";
import { formatCurrency, formatPercent } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats a positive amount as USD", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-0.42)).toBe("-$0.42");
  });

  // Unhappy paths: missing/invalid data must never render as "NaN"
  it("returns a placeholder for null, undefined, and NaN", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(Number.NaN)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats a ratio as a percentage", () => {
    expect(formatPercent(0.0423)).toBe("4.23%");
  });

  it("returns a placeholder for missing data", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(Number.NaN)).toBe("—");
  });
});
