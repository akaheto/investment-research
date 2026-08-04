import type { ReactNode } from "react";

/**
 * Card pattern — guide §4/§5: surface color, hairline border, 8px radius,
 * 16px padding, no drop shadows. `asOf` renders the guide-required
 * as-of timestamp caption in the title row.
 */
export function Card({ title, asOf, children, className = "" }: { title?: string; asOf?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-hairline bg-surface p-4 ${className}`}>
      {(title || asOf) && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-ink-2">{title}</h2>}
          {asOf && <span className="text-xs text-muted">as of {asOf}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Empty/error state — guide §5: explain what's missing and the next action. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-muted">{children}</div>;
}
