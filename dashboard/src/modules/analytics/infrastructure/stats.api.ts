import 'server-only';

import { apiGet } from '@/shared/api/http';
import { projectStatsSchema, type ProjectStats } from '../domain/stats';

/**
 * Takes the window as plain ISO strings rather than the application layer's
 * `DateRange`, so infrastructure keeps pointing inward at domain only.
 */
export function projectStats({
  projectId,
  from,
  to,
}: {
  projectId: string;
  from: string;
  to: string;
}): Promise<ProjectStats> {
  return apiGet('/v1/stats', projectStatsSchema, {
    query: { projectId, from, to },
  });
}
