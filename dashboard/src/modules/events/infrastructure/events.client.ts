import { recentEventsPageSchema, type RecentEventsPage } from '../domain/event';
import type { RecentEventsQuery } from './events.api';

/**
 * The browser half of the same read. It cannot call the API directly — no CORS
 * headers on /v1/events/recent — so it goes to this app's own route handler,
 * which is the only reason that handler exists.
 *
 * The response is parsed again here rather than trusted: the route handler is a
 * different process from this one, and "our own endpoint" is still a network
 * boundary.
 */
export async function fetchRecentEvents(
  { projectId, limit, cursor }: RecentEventsQuery,
  signal?: AbortSignal,
): Promise<RecentEventsPage> {
  const params = new URLSearchParams({ projectId });
  if (limit !== undefined) params.set('limit', String(limit));
  if (cursor !== undefined) params.set('cursor', cursor);

  const response = await fetch(`/api/events/recent?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : `the feed could not be loaded (${String(response.status)})`;
    throw new Error(message);
  }

  return recentEventsPageSchema.parse(await response.json());
}
