"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, NAV_ITEMS } from "@/lib/nav";
import { navIcons } from "./nav-icons";

export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-hairline bg-surface transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div>
            <div className="text-sm font-semibold text-ink">Investment Research</div>
            <div className="mt-0.5 text-xs text-muted">personal research desk</div>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center -mr-1 rounded-md hover:bg-page text-ink transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-2" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`relative mb-0.5 flex h-11 items-center gap-2.5 rounded-md px-3 transition-colors ${
                  active ? "font-medium text-accent" : "text-ink-2 hover:bg-page hover:text-ink"
                }`}
              >
                {active && <span aria-hidden className="absolute left-0 top-2 h-6 w-0.5 rounded-full bg-accent" />}
                <span aria-hidden className={active ? "text-accent" : "text-muted"}>{navIcons[item.label]}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
