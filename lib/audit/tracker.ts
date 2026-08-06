/**
 * Audit logging — track API usage, imports, and system events.
 * All functions are async but fire-and-forget (no await required).
 */

import { db } from "@/db/client";
import { apiCalls, fileImports, auditEvents } from "@/db/schema";
import { desc } from "drizzle-orm";

export interface ApiCallLog {
  provider: "fred" | "newsapi" | "finnhub" | "alphavantage" | "anthropic" | "cache";
  endpoint: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  recordsReturned?: number;
  error?: string;
}

export interface FileImportLog {
  importType: "transamerica_account" | "csv_watchlist" | string;
  filename: string;
  status: "success" | "failed";
  recordsProcessed?: number;
  recordsFailed?: number;
  error?: string;
}

export interface AuditEventLog {
  eventType: "data_refresh" | "watchlist_update" | "portfolio_assessment" | "login" | string;
  action: string;
  status?: "success" | "failed";
  details?: Record<string, unknown>;
  userId?: string;
}

export interface ApiConnectionStatus {
  provider: string;
  configured: boolean;
  lastCallAt: string | null;
  lastStatus: "success" | "error" | "unknown";
  lastError?: string;
  recordsReturned?: number;
}

/**
 * Log an API call (fire-and-forget).
 */
export function logApiCall(call: ApiCallLog) {
  (async () => {
    try {
      await db.insert(apiCalls).values({
        timestamp: new Date().toISOString(),
        provider: call.provider,
        endpoint: call.endpoint,
        method: call.method || "GET",
        statusCode: call.statusCode,
        durationMs: call.durationMs,
        recordsReturned: call.recordsReturned,
        error: call.error,
      });
    } catch (err) {
      console.error("Failed to log API call:", err);
    }
  })();
}

/**
 * Log a file import (fire-and-forget).
 */
export function logFileImport(imp: FileImportLog) {
  (async () => {
    try {
      await db.insert(fileImports).values({
        timestamp: new Date().toISOString(),
        importType: imp.importType,
        filename: imp.filename,
        status: imp.status,
        recordsProcessed: imp.recordsProcessed,
        recordsFailed: imp.recordsFailed || 0,
        error: imp.error,
      });
    } catch (err) {
      console.error("Failed to log file import:", err);
    }
  })();
}

/**
 * Log an audit event (fire-and-forget).
 */
export function logAuditEvent(evt: AuditEventLog) {
  (async () => {
    try {
      await db.insert(auditEvents).values({
        timestamp: new Date().toISOString(),
        eventType: evt.eventType,
        userId: evt.userId,
        action: evt.action,
        details: evt.details ? JSON.stringify(evt.details) : null,
        status: evt.status || "success",
      });
    } catch (err) {
      console.error("Failed to log audit event:", err);
    }
  })();
}

/**
 * Get API call statistics for dashboard.
 */
export async function getApiStats(hoursBack = 24) {
  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  try {
    const calls = await db.select().from(apiCalls);

    const byProvider: Record<string, { count: number; errors: number; avgDuration: number }> = {};

    for (const call of calls) {
      if (call.timestamp < cutoff) continue;

      if (!byProvider[call.provider]) {
        byProvider[call.provider] = { count: 0, errors: 0, avgDuration: 0 };
      }
      byProvider[call.provider].count++;
      if (call.error) byProvider[call.provider].errors++;
      if (call.durationMs) {
        byProvider[call.provider].avgDuration =
          (byProvider[call.provider].avgDuration * (byProvider[call.provider].count - 1) + call.durationMs) /
          byProvider[call.provider].count;
      }
    }

    const filteredCalls = calls.filter((c) => c.timestamp >= cutoff);
    return { ok: true, byProvider, totalCalls: filteredCalls.length };
  } catch (err) {
    console.error("Failed to get API stats:", err);
    return { ok: false, error: String(err), byProvider: {}, totalCalls: 0 };
  }
}

/**
 * Get recent file imports.
 */
export async function getRecentImports(limit = 50) {
  try {
    const imports = await db
      .select()
      .from(fileImports)
      .limit(limit);

    return { ok: true, imports: imports.reverse() };
  } catch (err) {
    console.error("Failed to get imports:", err);
    return { ok: false, error: String(err), imports: [] };
  }
}

/**
 * Get recent audit events.
 */
export async function getRecentEvents(limit = 50) {
  try {
    const events = await db.select().from(auditEvents).limit(limit);

    return { ok: true, events: events.reverse() };
  } catch (err) {
    console.error("Failed to get events:", err);
    return { ok: false, error: String(err), events: [] };
  }
}

/**
 * Get API connection status for all known providers.
 * Shows configured status, last call time, and whether it succeeded.
 */
export async function getApiConnectionsStatus(): Promise<ApiConnectionStatus[]> {
  const providers = [
    { name: "yahoo", envVar: null }, // free API, no key required
    { name: "coingecko", envVar: null }, // free API, no key required
    { name: "fred", envVar: "FRED_API_KEY" },
    { name: "finnhub", envVar: "FINNHUB_API_KEY" },
    { name: "alphavantage", envVar: "ALPHAVANTAGE_API_KEY" },
    { name: "newsapi", envVar: "NEWS_API_KEY" },
    { name: "ibkr", envVar: "IBKR_GATEWAY_URL" }, // Has multiple env vars, just check one
    { name: "anthropic", envVar: "ANTHROPIC_API_KEY" },
  ];

  try {
    const allCalls = await db.select().from(apiCalls).orderBy(desc(apiCalls.timestamp));

    const status: ApiConnectionStatus[] = providers.map((provider) => {
      const configured = provider.envVar ? Boolean(process.env[provider.envVar]) : true; // free APIs are "configured"
      const lastCall = allCalls.find((call) => call.provider === provider.name);

      return {
        provider: provider.name,
        configured,
        lastCallAt: lastCall?.timestamp || null,
        lastStatus: lastCall ? (lastCall.error ? "error" : "success") : "unknown",
        lastError: lastCall?.error || undefined,
        recordsReturned: lastCall?.recordsReturned || undefined,
      };
    });

    return status;
  } catch (err) {
    console.error("Failed to get API connection status:", err);
    return [];
  }
}

/**
 * Get API call history for a specific provider (last 30 days).
 */
export async function getProviderCallHistory(provider: string, daysBack = 30) {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  try {
    const calls = await db
      .select()
      .from(apiCalls)
      .orderBy(desc(apiCalls.timestamp));

    // Filter in JS to avoid complex SQL
    const filtered = calls.filter((c) => c.timestamp >= cutoff && c.provider === provider);
    return filtered;
  } catch (err) {
    console.error(`Failed to get call history for ${provider}:`, err);
    return [];
  }
}

/**
 * Get last data refresh timestamp for dashboard badge.
 */
export async function getLastRefreshSummary() {
  try {
    const events = await db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.timestamp))
      .limit(1);

    const lastRefresh = events.find((e) => e.eventType === "data_refresh");

    return {
      lastRefreshAt: lastRefresh?.timestamp ?? null,
    };
  } catch (err) {
    console.error("Failed to get last refresh summary:", err);
    return { lastRefreshAt: null };
  }
}
