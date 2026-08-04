"use client";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useState } from "react";

/**
 * Admin: Data verification dashboard.
 * Shows what data is actually in the database after refresh.
 * TODO: Wire to real database queries instead of mock data.
 */

interface DataStats {
  instruments: { count: number; lastUpdated?: string };
  prices: { count: number; symbols?: string[] };
  fundamentals: { count: number; symbols?: string[] };
  factorScores: { count: number; latestRun?: string };
  newsItems: { count: number; latestDate?: string };
  accounts: { count: number; totalBalance: number };
  holdings: { count: number; latestSnapshot?: string };
}

const mockStats: DataStats = {
  instruments: {
    count: 0,
    lastUpdated: undefined,
  },
  prices: {
    count: 0,
    symbols: [],
  },
  fundamentals: {
    count: 0,
    symbols: [],
  },
  factorScores: {
    count: 0,
    latestRun: undefined,
  },
  newsItems: {
    count: 0,
    latestDate: undefined,
  },
  accounts: {
    count: 2,
    totalBalance: 889244.94,
  },
  holdings: {
    count: 11,
    latestSnapshot: "2026-08-04",
  },
};

export default function DataPage() {
  const [stats] = useState<DataStats>(mockStats);
  // TODO: Fetch real stats from /api/admin/data-stats endpoint and update via setStats

  return (
    <>
      <PageHeader title="Data Verification" caption="Database stats and latest data snapshots" />

      <div className="grid grid-cols-12 gap-4">
        {/* Summary cards */}
        <Card className="col-span-12 lg:col-span-3">
          <div className="space-y-2">
            <div className="text-xs text-muted">Instruments</div>
            <div className="text-2xl font-semibold text-ink">{stats.instruments.count}</div>
            <div className="text-xs text-muted">Watchlist + portfolio holdings</div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-3">
          <div className="space-y-2">
            <div className="text-xs text-muted">Prices (EOD)</div>
            <div className="text-2xl font-semibold text-ink">{stats.prices.count}</div>
            <div className="text-xs text-muted">Latest daily bars</div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-3">
          <div className="space-y-2">
            <div className="text-xs text-muted">Factor Scores</div>
            <div className="text-2xl font-semibold text-ink">{stats.factorScores.count}</div>
            <div className="text-xs text-muted">Composite rankings</div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-3">
          <div className="space-y-2">
            <div className="text-xs text-muted">Accounts</div>
            <div className="text-2xl font-semibold text-ink">${(stats.accounts.totalBalance / 1e6).toFixed(2)}M</div>
            <div className="text-xs text-muted">Portfolio value</div>
          </div>
        </Card>

        {/* Detailed status */}
        <Card title="Provider Status" className="col-span-12 lg:col-span-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Yahoo Prices</span>
              <span className={stats.prices.count > 0 ? "text-gain" : "text-muted"}>
                {stats.prices.count > 0 ? `✓ ${stats.prices.count} bars` : "○ Pending"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Yahoo Fundamentals</span>
              <span className={stats.fundamentals.count > 0 ? "text-gain" : "text-muted"}>
                {stats.fundamentals.count > 0 ? `✓ ${stats.fundamentals.count} snapshots` : "○ Pending"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">FRED Macro Series</span>
              <span className="text-muted">○ Pending</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">CoinGecko Crypto</span>
              <span className="text-muted">○ Pending</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Signal Computation</span>
              <span className={stats.factorScores.count > 0 ? "text-gain" : "text-muted"}>
                {stats.factorScores.count > 0 ? `✓ Done at ${stats.factorScores.latestRun}` : "○ Pending"}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Cache Health" className="col-span-12 lg:col-span-6">
          <div className="space-y-2 text-sm text-muted">
            <div>Cache key: provider_cache table (TTL-based)</div>
            <div>Yahoo: 100ms/symbol + local cache</div>
            <div>CoinGecko: 50ms/symbol + 1hr cache</div>
            <div>FRED: 200ms/series + 1day cache</div>
            <div className="text-xs pt-2 border-t border-hairline">
              Last refresh: Check /api/test/refresh logs for timing details
            </div>
          </div>
        </Card>

        {/* Sample data */}
        {stats.prices.symbols && stats.prices.symbols.length > 0 && (
          <Card title={`Symbols with Prices (${stats.prices.count})`} className="col-span-12">
            <div className="flex flex-wrap gap-2">
              {stats.prices.symbols.slice(0, 10).map((s) => (
                <span key={s} className="inline-block text-xs bg-surface px-2 py-1 rounded text-accent font-mono">
                  {s}
                </span>
              ))}
              {stats.prices.symbols.length > 10 && <span className="text-xs text-muted">+{stats.prices.symbols.length - 10} more</span>}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card title="Testing End-to-End Flow" className="col-span-12 text-sm text-muted">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to /admin/refresh and click &ldquo;Refresh All Data&rdquo;</li>
            <li>Refresh will fetch prices, fundamentals, macro, and crypto from providers</li>
            <li>Return here to verify data populated (refresh page to see updated stats)</li>
            <li>Check /watchlist to see live quotes (if instruments added)</li>
            <li>Check /screener to see factor scores computed</li>
            <li>Check /markets for macro regime dial data</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
