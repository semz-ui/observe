import 'server-only';

import { apiGet, apiPost } from '@/shared/api/http';
import {
  createdProjectSchema,
  projectListSchema,
  type CreatedProject,
  type ProjectSummary,
} from '../domain/project';

export function listProjects(): Promise<ProjectSummary[]> {
  return apiGet('/api/projects', projectListSchema);
}

/**
 * There is no `GET /api/projects/:id` — the server only has list and create.
 * Resolving from the list is fine while the list is small and every caller in a
 * request shares one cached fetch; if it ever stops being fine, the fix is a
 * short server-side endpoint rather than something clever here.
 */
export async function findProject(
  projectId: string,
): Promise<ProjectSummary | null> {
  const projects = await listProjects();
  return projects.find((project) => project.id === projectId) ?? null;
}

/** The one call that returns a plaintext key. See `createdProjectSchema`. */
export function createProject(name: string): Promise<CreatedProject> {
  return apiPost('/api/projects', createdProjectSchema, { name });
}
