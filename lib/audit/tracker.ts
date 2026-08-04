/**
 * Audit logging — track API usage, imports, and system events.
 * All functions are async but fire-and-forget (no await required).
 */

import { db } from "@/db/client";
import { apiCalls, fileImports, auditEvents } from "@/db/schema";

export interface ApiCallLog {
  provider: "fred" | "newsapi" | "finnhub" | "alphavantage" | "anthropic";
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
