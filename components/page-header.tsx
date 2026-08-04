import type { ReactNode } from "react";

/** Page title row — guide §3: page title 24/600, caption 12 muted. */
export function PageHeader({ title, caption, actions }: { title: string; caption?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {caption && <p className="mt-1 text-xs text-muted">{caption}</p>}
      </div>
      {actions}
    </header>
  );
}
