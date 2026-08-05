"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isActive, NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "./theme-toggle";

/** Minimal stroke icons keyed by nav label — recessive chrome, 16px. */
const icons: Record<string, ReactNode> = {
  Dashboard: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
    </svg>
  ),
  Watchlist: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.8z" strokeLinejoin="round" />
    </svg>
  ),
  Screener: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 3h12M4.5 8h7M6.5 13h3" strokeLinecap="round" />
    </svg>
  ),
  Markets: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M1.5 13.5l4-5 3 2.5 5.5-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  News: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4" strokeLinecap="round" />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" strokeLinecap="round" />
    </svg>
  ),
  Oracle: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="6.5" />
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 3.5v1M8 11.5v1M3.5 8h1M11.5 8h1M4.9 4.9l.7.7M10.4 10.4l.7.7M11.1 4.9l-.7.7M5.6 10.4l-.7.7" strokeLinecap="round" />
    </svg>
  ),
  Research: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="6.8" cy="6.8" r="4.3" />
      <path d="M9.9 9.9l3 3" strokeLinecap="round" />
    </svg>
  ),
  Launchpad: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 1.5c1.8 1.6 2.6 4 2.3 6.8-.1.9-.4 1.7-.9 2.4H6.6c-.5-.7-.8-1.5-.9-2.4C5.4 5.5 6.2 3.1 8 1.5z" strokeLinejoin="round" />
      <circle cx="8" cy="6.3" r="1" />
      <path d="M6.2 10.2l-1.7 3M9.8 10.2l1.7 3" strokeLinecap="round" />
    </svg>
  ),
  Admin: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2.5 2.5h11v11h-11z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 5.5h11M5.5 5.5v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/**
 * Left rail, 220px (VISUAL_STYLE_GUIDE §5). Active item: accent text +
 * accent left bar. Inactive: secondary ink with a ghost-wash hover.
 */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-hairline bg-surface">
      <div className="px-4 pt-5 pb-4">
        <div className="text-sm font-semibold text-ink">Investment Research</div>
        <div className="mt-0.5 text-xs text-muted">personal research desk</div>
      </div>
      <nav className="flex-1 px-2" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative mb-0.5 flex h-8 items-center gap-2.5 rounded-md px-3 transition-colors ${
                active ? "font-medium text-accent" : "text-ink-2 hover:bg-page hover:text-ink"
              }`}
            >
              {active && <span aria-hidden className="absolute left-0 top-1.5 h-5 w-0.5 rounded-full bg-accent" />}
              <span aria-hidden className={active ? "text-accent" : "text-muted"}>{icons[item.label]}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-hairline p-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
