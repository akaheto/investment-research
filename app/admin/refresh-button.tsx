"use client";

import { useTransition } from "react";
import { triggerManualRefresh } from "./actions";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        await triggerManualRefresh();
      } catch (err) {
        console.error("Refresh failed:", err);
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
      {isPending && <div className="text-sm text-muted">✅ Refresh started. Check back in a minute for results.</div>}
    </div>
  );
}
