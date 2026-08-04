/**
 * POST /api/refresh — Vercel cron trigger, guarded by CRON_SECRET.
 * Vercel calls this on a schedule (configured in vercel.json).
 * CRON_SECRET prevents external invocation; check it before doing work.
 */
import { runRefresh } from "@/lib/refresh";

export const runtime = "nodejs"; // Required for background work on Vercel

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  const envSecret = process.env.CRON_SECRET;

  if (!envSecret || secret !== envSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await runRefresh();
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (e) {
    console.error("refresh failed:", e);
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
