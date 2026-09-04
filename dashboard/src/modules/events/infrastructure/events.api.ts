import 'server-only';

import { apiGet } from '@/shared/api/http';
import { recentEventsPageSchema, type RecentEventsPage } from '../domain/event';

export interface RecentEventsQuery {
  readonly projectId: string;
  readonly limit?: number;
  /**
   * Omit for the first page. Never pass an empty string: the API validates it
   * as a UUID, so a blank cursor is a 400 rather than "start from the top"
   * (`get-recent-events.dto.ts:29-31`). `http.ts` drops undefined params, which
   * is what makes this safe to spread.
   */
  readonly cursor?: string;
}

export function recentEvents({
  projectId,
  limit,
  cursor,
}: RecentEventsQuery): Promise<RecentEventsPage> {
  // Listed field by field rather than spread: `query` takes an index signature,
  // and naming them keeps the undefined-is-dropped contract visible here.
  return apiGet('/v1/events/recent', recentEventsPageSchema, {
    query: { projectId, limit, cursor },
  });
}
