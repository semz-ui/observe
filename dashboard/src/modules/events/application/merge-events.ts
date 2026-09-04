import type { ClickEvent } from '../domain/event';

export interface MergedFeed {
  readonly rows: readonly ClickEvent[];
  /**
   * True when we can *prove* events are missing between the polled head and
   * the pages already walked: the two sets share no id at all, which can only
   * happen if more than a full page arrived between two ticks. The cursor walk
   * cannot fill that hole — it only ever goes older — so the view says so
   * rather than quietly showing a feed with a bite out of it.
   */
  readonly hasGap: boolean;
}

/**
 * Ids are uuid v7, so they sort by time — which is exactly how the API orders
 * the feed (`prisma-event-feed.repository.ts:56-60`). That is what makes
 * merging two independently-fetched sets tractable: no timestamp parsing, and
 * no ambiguity about what "newer" means.
 */
export function mergeEvents(
  polled: readonly ClickEvent[],
  paged: readonly ClickEvent[],
): MergedFeed {
  const byId = new Map<string, ClickEvent>();
  for (const event of polled) byId.set(event.id, event);
  for (const event of paged) byId.set(event.id, event);

  const rows = [...byId.values()].sort((a, b) => (a.id < b.id ? 1 : -1));

  const overlaps = paged.some((event) =>
    polled.some((candidate) => candidate.id === event.id),
  );

  return {
    rows,
    hasGap: polled.length > 0 && paged.length > 0 && !overlaps,
  };
}
