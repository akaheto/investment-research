"use client";

import { useState } from "react";

export type ColumnKey = "valuation" | "growth" | "quality" | "momentum";

interface ColumnPickerProps {
  visible: Record<ColumnKey, boolean>;
  onChange: (visible: Record<ColumnKey, boolean>) => void;
}

const COLUMNS: Record<ColumnKey, string> = {
  valuation: "Valuation (Val)",
  growth: "Growth (Grw)",
  quality: "Quality (Qal)",
  momentum: "Momentum (Mom)",
};

export function ColumnPicker({ visible, onChange }: ColumnPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (col: ColumnKey) => {
    onChange({ ...visible, [col]: !visible[col] });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs px-3 py-1.5 border border-hairline rounded hover:bg-page text-ink transition-colors"
      >
        Columns ({Object.values(visible).filter(Boolean).length}/4)
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-40 bg-surface border border-hairline rounded shadow-lg p-3 min-w-max">
          {(Object.keys(COLUMNS) as ColumnKey[]).map((col) => (
            <label key={col} className="flex items-center gap-2 py-2 text-xs cursor-pointer hover:text-ink">
              <input
                type="checkbox"
                checked={visible[col]}
                onChange={() => handleToggle(col)}
                className="w-4 h-4 accent-accent"
              />
              <span>{COLUMNS[col]}</span>
            </label>
          ))}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-xs mt-2 px-2 py-1 bg-accent text-white rounded hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
