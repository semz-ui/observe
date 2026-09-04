import type { LucideIcon } from 'lucide-react';
import { BarChart3, FolderKanban, List } from 'lucide-react';

/**
 * The whole navigation of the dashboard — there is never more than this.
 * `href` is null while the milestone that builds the route is still ahead of
 * us: the item renders disabled rather than being hidden, so the shell reads as
 * finished and the gap is visible instead of implied.
 */
export interface NavItem {
  readonly label: string;
  readonly href: string | null;
  readonly icon: LucideIcon;
  readonly milestone: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Projects', href: null, icon: FolderKanban, milestone: 'M2' },
  { label: 'Events', href: null, icon: List, milestone: 'M3' },
  { label: 'Overview', href: null, icon: BarChart3, milestone: 'M4' },
];
