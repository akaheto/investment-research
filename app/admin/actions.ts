"use server";

/**
 * Admin server actions: manual refresh, data management.
 */

import { logAuditEvent } from "@/lib/audit/tracker";
import { runRefresh } from "@/lib/refresh";

export async function triggerManualRefresh() {
  try {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh triggered",
      details: { trigger: "admin_ui" },
    });

    const result = await runRefresh();

    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh completed",
      status: result.errors && result.errors.length > 0 ? "failed" : "success",
      details: result,
    });

    return { ok: true, message: "Refresh completed", result };
  } catch (error) {
    logAuditEvent({
      eventType: "data_refresh",
      action: "Manual refresh failed",
      status: "failed",
      details: { error: String(error) },
    });

    return { ok: false, error: String(error) };
  }
}
