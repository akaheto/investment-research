"use client";

import { useState, useTransition } from "react";
import { runMigrations } from "./actions";

export function MigrateButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const handleMigrate = () => {
    startTransition(async () => {
      const res = await runMigrations();
      setResult(res.message);
    });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleMigrate}
        disabled={isPending}
        className="px-4 py-2 bg-ink text-surface rounded font-semibold text-sm hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Applying migrations..." : "Apply DB Migrations"}
      </button>
      {result && <div className="text-sm text-muted">{result}</div>}
    </div>
  );
}
