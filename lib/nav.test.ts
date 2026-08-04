import { describe, expect, it } from "vitest";
import { isActive, NAV_ITEMS } from "@/lib/nav";

describe("isActive", () => {
  it("matches Dashboard only on the exact root path", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/watchlist", "/")).toBe(false);
  });

  it("keeps a section lit on its subpaths", () => {
    expect(isActive("/watchlist", "/watchlist")).toBe(true);
    expect(isActive("/watchlist/VTI", "/watchlist")).toBe(true);
  });

  it("does not light a section on a lookalike prefix", () => {
    // "/news2" must not activate "/news"
    expect(isActive("/news2", "/news")).toBe(false);
  });

  // Unhappy paths: unknown/empty routes activate nothing
  it("activates nothing for unknown or empty paths", () => {
    for (const item of NAV_ITEMS) {
      expect(isActive("/nonexistent", item.href)).toBe(false);
      expect(isActive("", item.href)).toBe(false);
    }
  });
});
