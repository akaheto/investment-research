"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/input";
import { deleteUnwatchedInstrument } from "./actions";

/** Cleanup tool for bad symbols created before addToWatchlist validated its input. */
export function DeleteInstrumentButton() {
  const [symbol, setSymbol] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const handleDelete = () => {
    if (!symbol.trim()) return;
    startTransition(async () => {
      const res = await deleteUnwatchedInstrument(symbol);
      setResult(res.message);
      if (res.ok) setSymbol("");
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 max-w-sm">
        <Input
          placeholder="Symbol (e.g. TESLA)"
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleDelete()}
          disabled={isPending}
        />
        <button
          onClick={handleDelete}
          disabled={isPending || !symbol.trim()}
          className="px-4 py-2 bg-loss text-surface rounded font-semibold text-sm hover:bg-loss/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isPending ? "Deleting..." : "Delete Instrument"}
        </button>
      </div>
      {result && <div className="text-sm text-muted">{result}</div>}
    </div>
  );
}
