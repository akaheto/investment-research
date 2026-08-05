/**
 * Navigation model for the left rail (VISUAL_STYLE_GUIDE §5). Kept as
 * data + a pure active-state helper so it's unit-testable without
 * rendering.
 */

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Screener", href: "/screener" },
  { label: "Markets", href: "/markets" },
  { label: "News", href: "/news" },
  { label: "Research", href: "/research" },
  { label: "Oracle", href: "/oracle" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Launchpad", href: "/launchpad" },
  { label: "Settings", href: "/settings" },
  { label: "Admin", href: "/admin/analytics" },
];

/**
 * Is a nav item active for the current pathname?
 * "/" matches only exactly; sections match themselves and their subpaths
 * ("/watchlist/VTI" keeps Watchlist lit).
 */
export function isActive(pathname: string, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
