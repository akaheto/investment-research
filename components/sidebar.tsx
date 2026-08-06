"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, NAV_ITEMS } from "@/lib/nav";
import { navIcons } from "./nav-icons";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
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
              <span aria-hidden className={active ? "text-accent" : "text-muted"}>{navIcons[item.label]}</span>
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
