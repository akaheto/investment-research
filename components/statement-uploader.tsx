"use client";

import { useState } from "react";
import { analyzeStatementScreenshot } from "@/app/settings/actions";

interface ExtractedHolding {
  fundName: string;
  units: number;
  balance: number;
  percent: number;
  confidence: "high" | "medium" | "low";
}

interface Account {
  id: number;
  name: string;
}

interface UploadState {
  loading: boolean;
  error: string | null;
  extracted: ExtractedHolding[] | null;
  statementDate?: string;
  accountName?: string;
  warnings: string[];
  selectedAccountId?: number;
}

export function StatementUploader({
  onConfirm,
  accounts = [],
}: {
  onConfirm?: (holdings: ExtractedHolding[], accountId: number, statementDate?: string) => void;
  accounts?: Account[];
}) {
  const [state, setState] = useState<UploadState>({
    loading: false,
    error: null,
    extracted: null,
    warnings: [],
  });
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setState((prev) => ({ ...prev, error: "Please upload an image (PNG or JPG)" }));
      return;
    }

    setState({ loading: true, error: null, extracted: null, warnings: [] });

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const mediaType = file.type as "image/png" | "image/jpeg" | "image/webp";

        console.log("📤 Sending to Claude for analysis...");
        const result = await analyzeStatementScreenshot(base64, mediaType);

        if (result.ok) {
          setState({
            loading: false,
            error: null,
            extracted: result.holdings || [],
            statementDate: result.statementDate,
            accountName: result.accountName,
            warnings: result.warnings || [],
          });
        } else {
          setState({
            loading: false,
            error: result.error ?? "Could not read holdings from that image.",
            extracted: null,
            warnings: [],
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setState({
        loading: false,
        error: `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
        extracted: null,
        warnings: [],
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files?.[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Privacy Notice */}
      <p className="text-xs text-muted px-3 py-2 bg-surface rounded">
        🔒 Screenshots are processed by Claude AI to extract holdings data only. Images are never saved to your server.
      </p>

      {/* Upload Zone */}
      {!state.extracted && (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive ? "border-accent bg-accent/10" : "border-hairline hover:border-accent/50"
          } ${state.loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleChange}
            disabled={state.loading}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="text-2xl">📸</div>
            <p className="text-sm font-medium text-ink">
              {state.loading ? "Analyzing..." : "Drop statement screenshot here or click to upload"}
            </p>
            <p className="text-xs text-muted">PNG or JPG of your account statement (holdings section)</p>
          </div>
        </label>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="p-3 bg-loss/10 border border-loss/30 rounded text-sm text-loss">
          ❌ {state.error}
        </div>
      )}

      {/* Warnings */}
      {state.warnings.length > 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded space-y-1">
          {state.warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-800 dark:text-yellow-200">
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Extracted Data Table */}
      {state.extracted && state.extracted.length > 0 && (
        <div className="space-y-3">
          {state.statementDate && (
            <p className="text-xs text-muted">
              📅 Statement Date: {state.statementDate}
              {state.accountName && ` · Account: ${state.accountName}`}
            </p>
          )}

          <div className="overflow-x-auto border border-hairline rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface">
                  <th className="px-3 py-2 text-left font-semibold text-ink-2">Fund Name</th>
                  <th className="px-3 py-2 text-right font-semibold text-ink-2">Units</th>
                  <th className="px-3 py-2 text-right font-semibold text-ink-2">Balance</th>
                  <th className="px-3 py-2 text-right font-semibold text-ink-2">%</th>
                  <th className="px-3 py-2 text-center font-semibold text-ink-2 text-xs">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {state.extracted.map((h, i) => (
                  <tr key={i} className="border-b border-hairline hover:bg-surface/50">
                    <td className="px-3 py-2 text-ink">{h.fundName}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{h.units.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">${h.balance.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-xs">{h.percent.toFixed(2)}%</td>
                    <td className="px-3 py-2 text-center text-xs">
                      {h.confidence === "high" ? "✅" : h.confidence === "medium" ? "⚠️" : "❓"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Account Selection */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-2">Load into Account:</label>
              <select
                value={state.selectedAccountId || ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    selectedAccountId: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-hairline rounded bg-page text-ink"
              >
                <option value="">-- Select Account --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Confirm Button */}
          {onConfirm && (
            <button
              onClick={() => {
                const accountId = state.selectedAccountId || accounts[0]?.id || 1;
                onConfirm(state.extracted!, accountId, state.statementDate);
                setState({
                  loading: false,
                  error: null,
                  extracted: null,
                  warnings: [],
                  selectedAccountId: undefined,
                });
              }}
              disabled={!state.selectedAccountId && accounts.length > 0}
              className="w-full px-4 py-2 text-sm bg-gain text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              ✅ Confirm & Load Holdings
            </button>
          )}

          {/* Clear Button */}
          <button
            onClick={() =>
              setState({
                loading: false,
                error: null,
                extracted: null,
                warnings: [],
              })
            }
            className="w-full px-4 py-2 text-sm bg-surface text-ink rounded hover:bg-surface/80"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
