import type { ClickEvent } from '../entities/click-event.entity';

export const EVENT_FEED_REPOSITORY = Symbol('EventFeedRepository');

// Keyset (cursor) pagination on `id`. Event ids are uuid v7 — time-ordered and
// unique — so ordering by id DESC yields a newest-first feed, and `cursor` (the
// last id seen) gives a stable "next page" that never drifts as new events
// arrive: WHERE id < cursor. `cursor` is undefined on the first page.
export interface RecentEventsQuery {
  projectId: string;
  limit: number;
  cursor?: string;
}

// `nextCursor` is the id to pass back for the following page, or null once the
// last page has been reached.
export interface RecentEventsPage {
  events: ClickEvent[];
  nextCursor: string | null;
}

// Read-side port for the raw-event feed. Separate from EventStatsRepository
// (aggregate reads) so row-level feed concerns stay isolated from stats.
export interface EventFeedRepository {
  recentEvents(query: RecentEventsQuery): Promise<RecentEventsPage>;
}
