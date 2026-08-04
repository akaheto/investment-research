/**
 * Test endpoint: POST /api/test/refresh
 * Manual data refresh for development/testing (no auth required locally).
 * TODO: Remove or gate behind admin auth before production.
 */

import { runRefresh } from "@/lib/refresh";

export async function POST() {
  try {
    const startTime = Date.now();

    console.log("🔄 Starting manual refresh...");
    const result = await runRefresh();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✓ Refresh complete in ${elapsed}s`);

    return Response.json(
      {
        ok: true,
        elapsed: `${elapsed}s`,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Refresh failed:", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
