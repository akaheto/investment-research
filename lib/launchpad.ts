/**
 * Launchpad project registry — a fixed list, edited by hand as projects
 * start/graduate. Not database-backed: these are in-repo experiments, not
 * user data. Deliberately separate from the real app (e.g. /oracle) —
 * a launchpad project is not synced with, and may not resemble, the real
 * feature it's named after until/unless it graduates.
 */

export interface LaunchpadProject {
  slug: string;
  title: string;
  description: string;
}

export const LAUNCHPAD_PROJECTS: LaunchpadProject[] = [
  {
    slug: "oracle",
    title: "Oracle",
    description: "Testing ground for AI-driven recommendation ideas before any of them reach the real Oracle page.",
  },
];
