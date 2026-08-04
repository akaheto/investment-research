"use client";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { PageHeader } from "@/components/page-header";
import { useState } from "react";

// TODO C2: Replace with real data from database + B2 provider
const mockWatchlist = [
  { id: 1, symbol: "AAPL", price: 198.45, change: 2.3, changePercent: 1.18, marketCap: 3.1e12 },
  { id: 2, symbol: "VTI", price: 312.4, change: -1.2, changePercent: -0.38, marketCap: 1.5e12 },
];

export default function WatchlistPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(mockWatchlist);

  const handleAdd = () => {
    if (search.trim()) {
      // TODO: fetch from Yahoo via B2 provider
      console.log("Add:", search);
      setSearch("");
    }
  };

  const handleRemove = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <>
      <PageHeader title="Watchlist" caption="Instruments you track, with live quotes and scores" />
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by symbol (e.g. AAPL)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      <Card>
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">Empty watchlist — add instruments above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-4 py-2 font-semibold text-ink-2">Symbol</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Price</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Change</th>
                  <th className="px-4 py-2 text-right font-semibold text-ink-2">Market Cap</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-hairline hover:bg-page">
                    <td className="px-4 py-2 font-mono">{item.symbol}</td>
                    <td className="px-4 py-2 text-right text-ink">${item.price.toFixed(2)}</td>
                    <td className={`px-4 py-2 text-right font-mono ${item.change >= 0 ? "text-gain" : "text-loss"}`}>
                      {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)} ({item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-2 text-right text-muted">${(item.marketCap / 1e12).toFixed(2)}T</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)}>
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
