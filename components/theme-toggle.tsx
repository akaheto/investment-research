"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
/** True after hydration, false during SSR — no effect/setState needed. */
const useMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

/**
 * Light/dark toggle. Renders a stable placeholder until mounted so the
 * server and client markup agree (next-themes hydration requirement).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-8 w-full items-center gap-2 rounded-md border border-hairline px-3 text-ink-2 transition-colors hover:bg-page"
      aria-label="Toggle color theme"
    >
      <span aria-hidden className="text-[13px]">
        {mounted ? (isDark ? "☾" : "☀") : "◐"}
      </span>
      <span className="text-xs">{mounted ? (isDark ? "Dark" : "Light") : "Theme"}</span>
    </button>
  );
}
