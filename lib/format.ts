/**
 * Shared display formatters. All formatters are null/NaN-safe and return
 * an em dash placeholder ("—") for missing data, so UI components never
 * render "NaN" or "undefined" to the user.
 */

const MISSING = "—";

/** Format a number as USD currency, e.g. 1234.5 → "$1,234.50". */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return MISSING;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/** Format a ratio as a percentage, e.g. 0.0423 → "4.23%". */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return MISSING;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
