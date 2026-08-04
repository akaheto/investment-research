"use client";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { useState, useEffect } from "react";
import { addToWatchlist, removeFromWatchlist, getWatchlistWithQuotes } from "./actions";
import type { WatchlistQuote } from "./actions";

/**
 * Watchlist page — real quotes from database, live add/remove.
 * Fetches prices from prices_daily table (populated by /api/test/refresh).
 */

export default function WatchlistPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<WatchlistQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    setLoading(true);
    const quotes = await getWatchlistWithQuotes();
    setItems(quotes);
    setLoading(false);
  }

  async function handleAdd() {
    if (!search.trim()) return;
    setRefreshing(true);
    const result = await addToWatchlist(search.toUpperCase());
    if (result.ok) {
      setSearch("");
      await loadWatchlist();
      // Trigger refresh to fetch real quotes
      await fetch("/api/test/refresh", { method: "POST" });
      await loadWatchlist();
    }
    setRefreshing(false);
  }

  async function handleRemove(instrumentId: number) {
    setRefreshing(true);
    await removeFromWatchlist(instrumentId);
    await loadWatchlist();
    setRefreshing(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetch("/api/test/refresh", { method: "POST" });
    await loadWatchlist();
    setRefreshing(false);
  }

  return (
    <>
      <PageHeader title="Watchlist" caption="Live quotes, real data from providers" />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Symbol (e.g. AAPL, MSFT)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          disabled={refreshing}
        />
        <Button onClick={handleAdd} disabled={refreshing}>
          Add
        </Button>
        <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted">Loading quotes...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">
            No instruments in watchlist. Add one above or go to /admin/refresh to seed test data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-4 py-2 font-semibold text-ink-2">Symbol</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Price</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Change</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Change %</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">As Of</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-hairline hover:bg-page">
                    <td className="px-4 py-2 font-mono font-semibold text-accent">{item.symbol}</td>
                    <td className="px-4 py-2 text-right text-ink">${item.price.toFixed(2)}</td>
                    <td
                      className={`px-4 py-2 text-right font-mono ${
                        item.change >= 0 ? "text-gain" : "text-loss"
                      }`}
                    >
                      {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-mono ${
                        item.changePercent >= 0 ? "text-gain" : "text-loss"
                      }`}
                    >
                      {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right text-muted text-xs">{item.asOf}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(item.id)}
                        disabled={refreshing}
                      >
                        ✕
                      </Button>
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
