"use client";

import { useState, useTransition } from "react";
import { triggerManualRefresh } from "./actions";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const handleRefresh = () => {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await triggerManualRefresh();
        setResult(res.message);
      } catch (err) {
        setResult(`❌ Refresh failed: ${String(err)}`);
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
      {isPending && <div className="text-sm text-muted">Refreshing — this can take a moment...</div>}
      {!isPending && result && <div className="text-sm text-muted">{result}</div>}
    </div>
  );
}
