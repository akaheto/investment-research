"use client";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { Sparkline } from "@/components/sparkline";
import { WatchlistNoteEditor } from "@/components/watchlist-note-editor";
import { useState, useEffect } from "react";
import { addToWatchlist, removeFromWatchlist, getWatchlistWithQuotes, getWatchlistTypes } from "./actions";
import type { WatchlistQuote } from "./actions";
import Link from "next/link";

/**
 * Watchlist page — real quotes from database with factor scores.
 * Use Admin > Refresh to fetch live data from providers.
 */

export default function WatchlistPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<WatchlistQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("user");
  const [availableTabs, setAvailableTabs] = useState<string[]>(["user"]);

  // Load watchlist types and quotes on mount
  useEffect(() => {
    loadTabs();
    loadWatchlist();
  }, []);

  // Reload watchlist when tab changes
  useEffect(() => {
    loadWatchlist();
  }, [activeTab]);

  async function loadTabs() {
    const result = await getWatchlistTypes();
    if (result.ok) {
      setAvailableTabs(result.types);
    }
  }

  async function loadWatchlist() {
    setLoading(true);
    const quotes = await getWatchlistWithQuotes(activeTab);
    setItems(quotes);
    setLoading(false);
  }

  async function handleAdd() {
    if (!search.trim()) return;
    setAdding(true);
    setAddError(null);
    // Not uppercased here — company-name input (e.g. "Tesla") needs its
    // casing intact for the provider's search to resolve it correctly.
    const result = await addToWatchlist(search);
    if (result.ok) {
      setSearch("");
      await loadWatchlist();
    } else {
      setAddError(result.error ?? "Could not add that symbol.");
    }
    setAdding(false);
  }

  async function handleRemove(instrumentId: number) {
    setAdding(true);
    await removeFromWatchlist(instrumentId);
    await loadWatchlist();
    setAdding(false);
  }

  function formatTabName(type: string): string {
    if (type === "user") return "Main Watchlist";
    // portfolio_transamerica → Transamerica
    return type
      .replace("portfolio_", "")
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return (
    <>
      <PageHeader title="Watchlist" caption="Real quotes, factor scores from Admin refresh" />

      {/* Watchlist tabs */}
      {availableTabs.length > 1 && (
        <div className="mb-4 flex gap-2 border-b border-hairline">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted hover:text-ink"
              }`}
            >
              {formatTabName(tab)}
            </button>
          ))}
        </div>
      )}

      {/* Add to watchlist — only on main watchlist */}
      {activeTab === "user" && (
        <div className="mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Symbol or company name (e.g. AAPL or Apple)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setAddError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={adding}
            />
            <Button onClick={handleAdd} disabled={adding}>
              Add
            </Button>
          </div>
          {addError && <div className="mt-1 text-sm text-loss">{addError}</div>}
        </div>
      )}

      {/* Portfolio watchlist notice */}
      {activeTab !== "user" && (
        <div className="mb-4 p-3 bg-surface rounded text-sm text-muted">
          Portfolio holdings are auto-populated from {formatTabName(activeTab)}. You can edit notes and target prices. To add investments, edit them in the Main Watchlist.
        </div>
      )}

      <Card>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted">Loading quotes...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">
            No instruments in watchlist. Add one above or go to /admin/refresh to seed test data.
          </div>
        ) : (
          <div className="overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)] lg:[mask-image:none]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-4 py-2 font-semibold text-ink-2">Symbol</th>
                  <th className="px-4 py-2 text-center font-semibold text-ink-2 text-xs">Trend</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Price</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Change %</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Score</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2 text-xs">Val</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2 text-xs">Grw</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2 text-xs">Qal</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2 text-xs">Mom</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-ink-2">Notes</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-hairline hover:bg-page">
                    <td className="px-4 py-2 font-mono font-semibold text-accent">
                      <Link href={`/instrument/${item.symbol}`} className="hover:underline">
                        {item.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Sparkline data={item.sparkline} />
                    </td>
                    <td className="px-4 py-2 text-right text-ink">${item.price.toFixed(2)}</td>
                    <td
                      className={`px-4 py-2 text-right font-mono text-sm ${
                        item.changePercent >= 0 ? "text-gain" : "text-loss"
                      }`}
                    >
                      {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-accent">
                      {item.compositeScore ? item.compositeScore.toFixed(0) : "–"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted text-xs">
                      {item.valuation ? item.valuation.toFixed(0) : "–"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted text-xs">
                      {item.growth ? item.growth.toFixed(0) : "–"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted text-xs">
                      {item.quality ? item.quality.toFixed(0) : "–"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted text-xs">
                      {item.momentum ? item.momentum.toFixed(0) : "–"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <WatchlistNoteEditor
                        instrumentId={item.id.toString()}
                        note={item.note}
                        targetPrice={item.targetPrice}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(item.id)}
                        disabled={adding}
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
