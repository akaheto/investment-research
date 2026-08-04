"use client";

import { useState } from "react";
import { triggerManualRefresh } from "./actions";

export function RefreshButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    setIsLoading(true);
    setMessage("");

    try {
      const result = await triggerManualRefresh();
      if (result.ok) {
        setMessage("✅ Refresh started. Check back in a minute for results.");
      } else {
        setMessage(`❌ Refresh failed: ${result.error}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="px-4 py-2 bg-accent text-surface rounded font-semibold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Refreshing..." : "Trigger Manual Refresh"}
      </button>
      {message && <div className="text-sm text-muted">{message}</div>}
    </div>
  );
}
