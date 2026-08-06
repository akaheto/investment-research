"use client";

import { useState } from "react";
import { updateWatchlistNote, updateWatchlistTarget } from "@/app/watchlist/actions";

interface WatchlistNoteEditorProps {
  instrumentId: string;
  note?: string;
  targetPrice?: number;
}

export function WatchlistNoteEditor({ instrumentId, note = "", targetPrice }: WatchlistNoteEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editNote, setEditNote] = useState(note);
  const [editTarget, setEditTarget] = useState(targetPrice?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (editTarget) {
        const price = parseFloat(editTarget);
        if (isNaN(price) || price <= 0) {
          setError("Target price must be a positive number");
          setSaving(false);
          return;
        }
      }

      await Promise.all([
        editNote !== note ? updateWatchlistNote(instrumentId, editNote) : Promise.resolve(),
        editTarget !== (targetPrice?.toString() || "") ? updateWatchlistTarget(instrumentId, editTarget ? parseFloat(editTarget) : null) : Promise.resolve(),
      ]);

      setIsOpen(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-muted hover:text-ink transition-colors"
        title="Edit note and target price"
      >
        📝
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-hairline rounded-lg max-w-sm w-full p-4 shadow-lg">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink mb-2">Note</label>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Investment thesis, reasons to hold..."
            className="w-full h-20 px-3 py-2 border border-hairline rounded text-sm bg-page text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink mb-2">Target Price</label>
          <input
            type="number"
            value={editTarget}
            onChange={(e) => setEditTarget(e.target.value)}
            placeholder="e.g. 150.00"
            className="w-full px-3 py-2 border border-hairline rounded text-sm bg-page text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            step="0.01"
            min="0"
          />
        </div>

        {error && <div className="text-xs text-loss mb-3">{error}</div>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              setEditNote(note);
              setEditTarget(targetPrice?.toString() || "");
              setError(null);
              setIsOpen(false);
            }}
            disabled={saving}
            className="px-3 py-2 text-sm rounded border border-hairline text-ink hover:bg-page transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-2 text-sm rounded bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
