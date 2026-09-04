import type { LucideIcon } from 'lucide-react';
import { BarChart3, FolderKanban, List } from 'lucide-react';

/**
 * The whole navigation of the dashboard — there is never more than this.
 *
 * `href` takes the project currently in scope, because most of the dashboard
 * lives under `/projects/[projectId]`. Returning null means the item renders
 * disabled: either the milestone that builds the route is still ahead of us, or
 * it needs a project and none is selected. The item stays visible rather than
 * disappearing, so the shell reads as finished and the gap is explicit.
 */
export interface NavItem {
  readonly label: string;
  readonly href: (projectId: string | null) => string | null;
  readonly icon: LucideIcon;
  readonly milestone: string;
  /** False while the milestone that builds this route is still ahead of us. */
  readonly available: boolean;
  readonly requiresProject: boolean;
  /**
   * Whether deeper paths still count as this item. False for Projects: its
   * `/projects` is a prefix of every project-scoped route, so matching
   * descendants would light it up alongside Events on `/projects/x/events`.
   */
  readonly matchesDescendants: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Projects',
    href: () => '/projects',
    icon: FolderKanban,
    milestone: 'M2',
    available: true,
    requiresProject: false,
    matchesDescendants: false,
  },
  {
    label: 'Events',
    href: (projectId) =>
      projectId === null ? null : `/projects/${projectId}/events`,
    icon: List,
    milestone: 'M3',
    available: true,
    requiresProject: true,
    matchesDescendants: true,
  },
  {
    label: 'Overview',
    href: () => null,
    icon: BarChart3,
    milestone: 'M4',
    available: false,
    requiresProject: true,
    matchesDescendants: true,
  },
];
