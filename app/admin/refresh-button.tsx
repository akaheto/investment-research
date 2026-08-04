"use client";

import { useState, useTransition } from "react";
import { triggerManualRefresh } from "./actions";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleRefresh = () => {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await triggerManualRefresh();
        if (result?.ok === true) {
          setMessage(result.message || "✅ Refresh completed");
        } else {
          setMessage(result?.message || "❌ Refresh failed");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMessage(`❌ ${msg}`);
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="px-4 py-2 bg-accent text-surface rounded font-semibold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Refreshing..." : "Trigger Manual Refresh"}
      </button>
      {message && <div className="text-sm text-muted">{message}</div>}
    </div>
  );
}
