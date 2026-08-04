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
      if (!result) {
        throw new Error("No response from server");
      }
      if (result.ok === true) {
        setMessage(result.message || "✅ Refresh completed");
      } else {
        setMessage(result.message || "❌ Refresh failed");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Refresh error:", err);
      setMessage(`❌ ${errorMsg}`);
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
