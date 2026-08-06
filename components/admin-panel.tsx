"use client";

import { useEffect, useState } from "react";
import {
  seedFunds,
  setupMainAccount,
  setupManagementStaffIRA,
  generateAllSuggestions,
  assessAllEventImpacts,
  initializeEconomicCalendar,
  getSetupStatus,
} from "@/app/settings/actions";

interface SetupStatus {
  accountsSeeded: boolean;
  fundsSeeded: boolean;
}

export function AdminPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [expandedSection, setExpandedSection] = useState<"setup" | "analysis" | null>("setup");
  const [status, setStatus] = useState<SetupStatus>({ accountsSeeded: false, fundsSeeded: false });

  useEffect(() => {
    getSetupStatus().then(setStatus);
  }, []);

  const handleAction = async (label: string, action: () => Promise<{ message?: string; ok?: boolean; error?: string }>) => {
    setLoading(label);
    try {
      console.log(`🔄 Starting action: ${label}`);
      const result = await action();
      console.log(`✓ Action completed: ${label}`, result);
      const message = result.message || (result.ok ? "Success" : "Failed");
      setResults((prev) => ({
        ...prev,
        [label]: message,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Action failed: ${label}`, error);
      setResults((prev) => ({
        ...prev,
        [label]: `Error: ${errorMsg}`,
      }));
    } finally {
      setLoading(null);
    }
  };

  const setupComplete = status.fundsSeeded && status.accountsSeeded;

  return (
    <div className="space-y-4">
      {/* Setup Section — Only show if not complete */}
      {!setupComplete && (
      <div className="border border-hairline rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === "setup" ? null : "setup")}
          className="w-full px-4 py-3 bg-surface text-left font-semibold text-sm text-ink hover:bg-surface/80 flex justify-between items-center"
        >
          <span>📊 Initial Setup</span>
          <span>{expandedSection === "setup" ? "▼" : "▶"}</span>
        </button>

        {expandedSection === "setup" && (
          <div className="p-4 space-y-3 border-t border-hairline">
            <div className="space-y-2">
              <button
                onClick={() => handleAction("seedFunds", seedFunds)}
                disabled={loading === "seedFunds"}
                className="w-full px-4 py-2 text-sm bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 text-left"
              >
                {loading === "seedFunds" ? "Loading..." : "1. Seed Transamerica Funds (24)"}
              </button>
              {results.seedFunds && (
                <div className="text-xs text-muted pl-4">{results.seedFunds}</div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAction("setupMain", setupMainAccount)}
                disabled={loading === "setupMain"}
                className="w-full px-4 py-2 text-sm bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 text-left"
              >
                {loading === "setupMain" ? "Loading..." : "2. Setup Main 403b Account"}
              </button>
              {results.setupMain && (
                <div className="text-xs text-muted pl-4">{results.setupMain}</div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAction("setupStaff", setupManagementStaffIRA)}
                disabled={loading === "setupStaff"}
                className="w-full px-4 py-2 text-sm bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 text-left"
              >
                {loading === "setupStaff" ? "Loading..." : "3. Setup Management Staff IRA"}
              </button>
              {results.setupStaff && (
                <div className="text-xs text-muted pl-4">{results.setupStaff}</div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Analysis Section */}
      <div className="border border-hairline rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === "analysis" ? null : "analysis")}
          className="w-full px-4 py-3 bg-surface text-left font-semibold text-sm text-ink hover:bg-surface/80 flex justify-between items-center"
        >
          <span>🎯 Portfolio Analysis (Epic G & E)</span>
          <span>{expandedSection === "analysis" ? "▼" : "▶"}</span>
        </button>

        {expandedSection === "analysis" && (
          <div className="p-4 space-y-3 border-t border-hairline">
            <p className="text-xs text-muted mb-3">
              Initialize calendar, generate optimization suggestions, and assess event impact for all accounts.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleAction("initializeCalendar", initializeEconomicCalendar)}
                disabled={loading === "initializeCalendar"}
                className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded hover:opacity-90 disabled:opacity-50 text-left"
              >
                {loading === "initializeCalendar"
                  ? "Initializing..."
                  : "E2: Initialize Economic Calendar (FOMC, CPI)"}
              </button>
              {results.initializeCalendar && (
                <div className="text-xs text-muted pl-4 max-h-20 overflow-y-auto">
                  {results.initializeCalendar}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAction("generateSuggestions", generateAllSuggestions)}
                disabled={loading === "generateSuggestions"}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:opacity-90 disabled:opacity-50 text-left"
              >
                {loading === "generateSuggestions"
                  ? "Analyzing..."
                  : "G2/G3: Generate Optimization Suggestions"}
              </button>
              {results.generateSuggestions && (
                <div className="text-xs text-muted pl-4 max-h-20 overflow-y-auto">
                  {results.generateSuggestions}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAction("assessEvents", assessAllEventImpacts)}
                disabled={loading === "assessEvents"}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:opacity-90 disabled:opacity-50 text-left"
              >
                {loading === "assessEvents" ? "Analyzing..." : "G5: Assess Event Impact (Claude)"}
              </button>
              {results.assessEvents && (
                <div className="text-xs text-muted pl-4 max-h-20 overflow-y-auto">
                  {results.assessEvents}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-xs text-muted bg-surface rounded p-3">
        <p className="font-semibold mb-1">How to use:</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Run Initial Setup if this is your first time</li>
          <li>Run Portfolio Analysis to generate all G2-G5 data</li>
          <li>View results on the Portfolio page at /portfolio</li>
        </ol>
      </div>
    </div>
  );
}
