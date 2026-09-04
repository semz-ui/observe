'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import type { ProjectSummary } from '../domain/project';

export interface ProjectSwitcherViewState {
  readonly projects: readonly ProjectSummary[];
  /** The project the URL is scoped to, or null on an unscoped route. */
  readonly current: ProjectSummary | null;
  /** What the trigger says — the view should never assemble this itself. */
  readonly label: string;
  readonly isEmpty: boolean;
  readonly select: (projectId: string) => void;
}

/**
 * The first ViewModel, and it exists because there is genuinely client state to
 * own: which project the URL is scoped to, and what selecting one does.
 *
 * Scope lives in the URL rather than a store — shareable links, and it survives
 * a refresh without any state library. `useParams` reads the matched segment
 * even though this renders in the header, above the `[projectId]` segment.
 *
 * Note what is *not* here: whether the menu is open. That belongs to the
 * primitive, not to the app.
 */
export function useProjectSwitcherViewModel(
  projects: readonly ProjectSummary[],
): ProjectSwitcherViewState {
  const params = useParams();
  const router = useRouter();

  const projectId =
    typeof params.projectId === 'string' ? params.projectId : null;

  const current = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projects, projectId],
  );

  const select = useCallback(
    (id: string) => {
      router.push(`/projects/${id}`);
    },
    [router],
  );

  return {
    projects,
    current,
    // An id in the URL with no matching project means someone else's link or a
    // deleted project. Say so rather than showing a blank trigger.
    label:
      current?.name ??
      (projectId === null ? 'All projects' : 'Unknown project'),
    isEmpty: projects.length === 0,
    select,
  };
}
