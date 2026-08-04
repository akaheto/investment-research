"use client";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useState } from "react";

/**
 * D3 Screener — rank instruments by factor scores and presets.
 * TODO: Connect to real factor_scores table and watchlist instruments.
 */

const mockResults = [
  {
    symbol: "AAPL",
    name: "Apple Inc",
    score: 74,
    preset: "Balanced",
    valuation: 68,
    growth: 72,
    quality: 85,
    momentum: 71,
    confidence: "high" as const,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    score: 82,
    preset: "Balanced",
    valuation: 75,
    growth: 88,
    quality: 90,
    momentum: 79,
    confidence: "high" as const,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc",
    score: 58,
    preset: "Growth",
    valuation: 42,
    growth: 92,
    quality: 55,
    momentum: 62,
    confidence: "medium" as const,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc",
    score: 76,
    preset: "Balanced",
    valuation: 70,
    growth: 80,
    quality: 82,
    momentum: 74,
    confidence: "high" as const,
  },
  {
    symbol: "VTI",
    name: "Vanguard Total US Stock",
    score: 68,
    preset: "Balanced",
    valuation: 65,
    growth: 70,
    quality: 75,
    momentum: 63,
    confidence: "high" as const,
  },
];

export default function ScreenerPage() {
  const [sortBy, setSortBy] = useState<"score" | "valuation" | "growth" | "quality" | "momentum">("score");
  const [presetFilter, setPresetFilter] = useState<string>("all");

  const presets = ["Balanced", "Value", "Growth", "Quality"];
  const filtered = presetFilter === "all" ? mockResults : mockResults.filter((r) => r.preset === presetFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    const aVal = a[sortBy as "valuation" | "growth" | "quality" | "momentum"];
    const bVal = b[sortBy as "valuation" | "growth" | "quality" | "momentum"];
    return bVal - aVal;
  });

  return (
    <>
      <PageHeader title="Screener" caption="Rank instruments by factor scores and presets" />

      <div className="mb-4 flex gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">Preset:</label>
          <select
            value={presetFilter}
            onChange={(e) => setPresetFilter(e.target.value)}
            className="h-8 rounded-md border border-edge bg-surface px-2 text-sm text-ink"
          >
            <option value="all">All</option>
            {presets.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              const val = e.target.value as "score" | "valuation" | "growth" | "quality" | "momentum";
              setSortBy(val);
            }}
            className="h-8 rounded-md border border-edge bg-surface px-2 text-sm text-ink"
          >
            <option value="score">Composite Score</option>
            <option value="valuation">Valuation</option>
            <option value="growth">Growth</option>
            <option value="quality">Quality</option>
            <option value="momentum">Momentum</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-4 py-2 font-semibold text-ink-2">Symbol</th>
                <th className="px-4 py-2 text-right font-semibold text-ink-2">Score</th>
                <th className="px-4 py-2 text-right font-semibold text-ink-2">Valuation</th>
                <th className="px-4 py-2 text-right font-semibold text-ink-2">Growth</th>
                <th className="px-4 py-2 text-right font-semibold text-ink-2">Quality</th>
                <th className="px-4 py-2 text-right font-semibold text-ink-2">Momentum</th>
                <th className="px-4 py-2 text-center font-semibold text-ink-2">Conf</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.symbol} className="border-b border-hairline hover:bg-page">
                  <td className="px-4 py-2 font-mono font-semibold text-accent">{row.symbol}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="inline-block w-12 bg-gradient-to-r from-loss to-gain px-2 py-1 rounded text-xs font-semibold text-white">
                      {row.score}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-ink">{row.valuation}</td>
                  <td className="px-4 py-2 text-right text-ink">{row.growth}</td>
                  <td className="px-4 py-2 text-right text-ink">{row.quality}</td>
                  <td className="px-4 py-2 text-right text-ink">{row.momentum}</td>
                  <td className="px-4 py-2 text-center text-xs text-muted">
                    {row.confidence === "high" ? "✓" : row.confidence === "medium" ? "~" : "?"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
