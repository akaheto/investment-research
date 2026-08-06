"use client";

import { Card, EmptyState } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Sparkline } from "@/components/sparkline";
import { ColumnPicker, type ColumnKey } from "@/components/column-picker";
import { useState, useEffect } from "react";
import { getScreenerResults } from "./actions";
import type { ScreenerResult } from "./actions";
import Link from "next/link";

export default function ScreenerPage() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"compositeScore" | "valuation" | "growth" | "quality" | "momentum">(
    "compositeScore"
  );
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window === "undefined") {
      return { valuation: true, growth: true, quality: true, momentum: true };
    }
    const saved = localStorage.getItem("screener_visible_columns");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { valuation: true, growth: true, quality: true, momentum: true };
      }
    }
    return { valuation: true, growth: true, quality: true, momentum: true };
  });

  useEffect(() => {
    localStorage.setItem("screener_visible_columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

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
      <PageHeader
        title="Screener"
        caption="Rank instruments by factor scores and presets"
        actions={<ColumnPicker visible={visibleColumns} onChange={setVisibleColumns} />}
      />

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
          <div className="overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)] lg:[mask-image:none]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-4 py-2 font-semibold text-ink-2">Symbol</th>
                  <th className="px-4 py-2 text-center font-semibold text-ink-2 text-xs">Trend</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Score</th>
                  {visibleColumns.valuation && (
                    <th className="px-4 py-2 text-right font-semibold text-ink-2">Valuation</th>
                  )}
                  {visibleColumns.growth && (
                    <th className="px-4 py-2 text-right font-semibold text-ink-2">Growth</th>
                  )}
                  {visibleColumns.quality && (
                    <th className="px-4 py-2 text-right font-semibold text-ink-2">Quality</th>
                  )}
                  {visibleColumns.momentum && (
                    <th className="px-4 py-2 text-right font-semibold text-ink-2">Momentum</th>
                  )}
                  <th className="px-4 py-2 text-center font-semibold text-ink-2">Conf</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.symbol} className="border-b border-hairline hover:bg-page">
                    <td className="px-4 py-2 font-mono font-semibold text-accent">
                      <Link href={`/instrument/${row.symbol}`} className="hover:underline">
                        {row.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Sparkline data={row.sparkline} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="inline-block w-12 bg-gradient-to-r from-loss to-gain px-2 py-1 rounded text-xs font-semibold text-white">
                        {Math.round(row.compositeScore)}
                      </span>
                    </td>
                    {visibleColumns.valuation && (
                      <td className="px-4 py-2 text-right text-ink">{Math.round(row.valuation)}</td>
                    )}
                    {visibleColumns.growth && (
                      <td className="px-4 py-2 text-right text-ink">{Math.round(row.growth)}</td>
                    )}
                    {visibleColumns.quality && (
                      <td className="px-4 py-2 text-right text-ink">{Math.round(row.quality)}</td>
                    )}
                    {visibleColumns.momentum && (
                      <td className="px-4 py-2 text-right text-ink">{Math.round(row.momentum)}</td>
                    )}
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
