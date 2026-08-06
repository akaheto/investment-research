"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { NavDrawer } from "./nav-drawer";

export function MobileNavBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-hairline bg-surface px-3 lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center -ml-1 rounded-md hover:bg-page text-ink transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink">Investment Research</span>
        <ThemeToggle />
      </header>
      <NavDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
