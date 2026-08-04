"use client";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/button";
import { useState } from "react";

/**
 * Admin: Data refresh controls for testing end-to-end provider flows.
 * TODO: Move to admin-only routes (check CRON_SECRET on server actions).
 */

interface RefreshStatus {
  stage: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  timestamp?: string;
}

export default function RefreshPage() {
  const [statuses, setStatuses] = useState<RefreshStatus[]>([
    { stage: "Prices (Yahoo)", status: "pending" },
    { stage: "Fundamentals (Yahoo)", status: "pending" },
    { stage: "Crypto (CoinGecko)", status: "pending" },
    { stage: "Macro (FRED)", status: "pending" },
    { stage: "Factor Scores", status: "pending" },
    { stage: "Cache Cleanup", status: "pending" },
  ]);

  const handleRefresh = async () => {
    // Reset statuses
    setStatuses(statuses.map((s) => ({ ...s, status: "pending" as const, message: undefined })));

    try {
      // Call the test refresh endpoint (dev/testing only)
      const response = await fetch("/api/test/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.statusText}`);
      }

      await response.json();

      // Simulate progressive status updates
      const newStatuses = statuses.map((s) => ({
        ...s,
        status: "success" as const,
        timestamp: new Date().toLocaleTimeString(),
      }));

      setStatuses(newStatuses);
    } catch (err) {
      setStatuses(
        statuses.map((s) => ({
          ...s,
          status: "error" as const,
          message: err instanceof Error ? err.message : "Unknown error",
        }))
      );
    }
  };

  return (
    <>
      <PageHeader title="Data Refresh" caption="Trigger provider pipelines and monitor status" />

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12">
          <div className="mb-4">
            <Button onClick={handleRefresh}>Refresh All Data</Button>
          </div>

          <div className="space-y-2">
            {statuses.map((status) => (
              <div
                key={status.stage}
                className="flex items-center justify-between p-3 border border-hairline rounded"
              >
                <div className="flex-1">
                  <div className="font-semibold text-sm text-ink">{status.stage}</div>
                  {status.message && <div className="text-xs text-muted mt-1">{status.message}</div>}
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      status.status === "success"
                        ? "bg-gain/10 text-gain"
                        : status.status === "error"
                          ? "bg-loss/10 text-loss"
                          : status.status === "running"
                            ? "bg-accent/10 text-accent"
                            : "bg-surface text-muted"
                    }`}
                  >
                    {status.status === "running" ? "⏳" : status.status === "success" ? "✓" : status.status === "error" ? "✕" : "○"}{" "}
                    {status.status}
                  </div>
                  {status.timestamp && <div className="text-xs text-muted mt-1">{status.timestamp}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Instructions" className="col-span-12 text-sm text-muted">
          <ol className="list-decimal list-inside space-y-1">
            <li>Click &ldquo;Refresh All Data&rdquo; to trigger the provider pipeline</li>
            <li>Prices refresh from Yahoo Finance (100ms delay per symbol)</li>
            <li>Fundamentals fetch from Yahoo quoteSummary endpoint</li>
            <li>Crypto prices from CoinGecko (50ms delay per symbol)</li>
            <li>Macro series from FRED (200ms delay per series)</li>
            <li>Factor scores compute after all data is in</li>
            <li>Check /api/refresh logs for details; use CRON_SECRET for production</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
