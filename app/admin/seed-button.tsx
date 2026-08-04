"use client";

import { useState } from "react";
import { seedMag7 } from "./seed-action";

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSeed() {
    setIsLoading(true);
    setMessage("");

    try {
      const result = await seedMag7();
      if (result.ok) {
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ Seed failed: ${result.error}`);
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
        onClick={handleSeed}
        disabled={isLoading}
        className="px-4 py-2 bg-gain text-surface rounded font-semibold text-sm hover:bg-gain/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Seeding..." : "Seed Mag 7"}
      </button>
      {message && <div className="text-sm text-muted">{message}</div>}
    </div>
  );
}
