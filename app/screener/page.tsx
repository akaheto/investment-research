"use client";

import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useState, useEffect } from "react";
import { getScreenerResults } from "./actions";
import type { ScreenerResult } from "./actions";

export default function ScreenerPage() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"compositeScore" | "valuation" | "growth" | "quality" | "momentum">(
    "compositeScore"
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getScreenerResults("balanced");
      setResults(data);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "compositeScore") return b.compositeScore - a.compositeScore;
    const aVal = a[sortBy as "valuation" | "growth" | "quality" | "momentum"];
    const bVal = b[sortBy as "valuation" | "growth" | "quality" | "momentum"];
    return bVal - aVal;
  });

  return (
    <>
      <PageHeader title="Screener" caption="Rank instruments by factor scores and presets" />

      <div className="mb-4 flex gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              const val = e.target.value as "compositeScore" | "valuation" | "growth" | "quality" | "momentum";
              setSortBy(val);
            }}
            className="h-8 rounded-md border border-edge bg-surface px-2 text-sm text-ink"
          >
            <option value="compositeScore">Composite Score</option>
            <option value="valuation">Valuation</option>
            <option value="growth">Growth</option>
            <option value="quality">Quality</option>
            <option value="momentum">Momentum</option>
          </select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted">Loading screener data...</div>
        ) : sorted.length === 0 ? (
          <EmptyState>
            No instruments in watchlist. Add some stocks to your watchlist first, then they will appear here ranked by
            factor scores.
          </EmptyState>
        ) : (
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
                        {Math.round(row.compositeScore)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-ink">{Math.round(row.valuation)}</td>
                    <td className="px-4 py-2 text-right text-ink">{Math.round(row.growth)}</td>
                    <td className="px-4 py-2 text-right text-ink">{Math.round(row.quality)}</td>
                    <td className="px-4 py-2 text-right text-ink">{Math.round(row.momentum)}</td>
                    <td className="px-4 py-2 text-center text-xs text-muted">
                      {row.confidence === "high" ? "✓" : "?"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
