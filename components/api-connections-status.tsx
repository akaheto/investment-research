"use client";

import Link from "next/link";
import type { ApiConnectionStatus } from "@/lib/audit/tracker";

interface ApiConnectionsStatusProps {
  data: ApiConnectionStatus[];
}

export function ApiConnectionsStatus({ data }: ApiConnectionsStatusProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="px-4 py-2 font-semibold text-ink-2">Provider</th>
            <th className="px-4 py-2 text-center font-semibold text-ink-2">Configured</th>
            <th className="px-4 py-2 text-right font-semibold text-ink-2">Last Call</th>
            <th className="px-4 py-2 text-center font-semibold text-ink-2">Status</th>
            <th className="px-4 py-2 text-right font-semibold text-ink-2 text-xs">Records</th>
          </tr>
        </thead>
        <tbody>
          {data.map((conn) => (
            <Link key={conn.provider} href={`/admin/analytics/connections/${conn.provider}`}>
              <tr className="border-b border-hairline hover:bg-page cursor-pointer">
                <td className="px-4 py-2 font-mono font-semibold text-accent hover:underline">{conn.provider}</td>
                <td className="px-4 py-2 text-center">
                  {conn.configured ? (
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-gain/10 text-gain font-semibold">
                      ✓
                    </span>
                  ) : (
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-loss/10 text-loss font-semibold">
                      ✕
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right text-muted text-xs">
                  {conn.lastCallAt ? new Date(conn.lastCallAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2 text-center">
                  {conn.lastStatus === "success" && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-gain/10 text-gain font-semibold">
                      ✓ Success
                    </span>
                  )}
                  {conn.lastStatus === "error" && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-loss/10 text-loss font-semibold">
                      ✕ Error
                    </span>
                  )}
                  {conn.lastStatus === "unknown" && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-muted/10 text-muted font-semibold">
                      — Never called
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right text-muted text-xs">
                  {conn.recordsReturned !== undefined ? conn.recordsReturned : "—"}
                </td>
              </tr>
            </Link>
          ))}
        </tbody>
      </table>
    </div>
  );
}
