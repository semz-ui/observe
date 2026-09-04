import type { ClickEvent } from '../domain/event';

/**
 * Everything the feed has ever been shown, keyed by id.
 *
 * Accumulating rather than recomputing is the whole point. The two queries only
 * ever report a *window*: the poll returns the newest page, the cursor walk
 * returns one older page at a time. An event that has scrolled out of the
 * polled window and was never reached by the walk exists in neither — so
 * deriving the table from "current head + walked pages" makes rows that were on
 * screen a minute ago silently vanish.
 *
 * The map grows for the life of the page. That is bounded by how long someone
 * leaves a tab open on one project; if it ever stops being bounded enough, the
 * fix is to drop the oldest entries beyond what the table can scroll to.
 */
export interface FeedState {
  readonly events: ReadonlyMap<string, ClickEvent>;
  /**
   * Set once we can *prove* events are missing: a polled page that shares no id
   * with anything seen so far, which can only happen if more than a page
   * arrived between two ticks. Sticky, because the cursor walk only ever goes
   * older — nothing will come back to fill the hole.
   */
  readonly hasGap: boolean;
}

export const EMPTY_FEED: FeedState = { events: new Map(), hasGap: false };

function withEvents(
  state: FeedState,
  incoming: readonly ClickEvent[],
  hasGap: boolean,
): FeedState {
  const events = new Map(state.events);
  for (const event of incoming) events.set(event.id, event);
  return { events, hasGap };
}

/**
 * Absorb a page from the poll. The ids that were not already known are the ones
 * that just arrived, which is what the view flashes — and why this is separate
 * from `absorbPage`: an older page fetched by "load more" is not new, however
 * unfamiliar its ids are.
 */
export function absorbHead(
  state: FeedState,
  head: readonly ClickEvent[],
): { state: FeedState; freshIds: readonly string[] } {
  const freshIds = head
    .filter((event) => !state.events.has(event.id))
    .map((event) => event.id);

  const gapOpened =
    state.events.size > 0 && head.length > 0 && freshIds.length === head.length;

  return {
    state: withEvents(state, head, state.hasGap || gapOpened),
    freshIds,
  };
}

/** Absorb an older page from the cursor walk: never new, never a gap. */
export function absorbPage(
  state: FeedState,
  page: readonly ClickEvent[],
): FeedState {
  return withEvents(state, page, state.hasGap);
}

/**
 * Newest first. Ids are uuid v7, so they sort by time — the same order the API
 * returns (`prisma-event-feed.repository.ts:56-60`), with no timestamp parsing
 * and no ambiguity about what "newer" means.
 */
export function feedRows(state: FeedState): readonly ClickEvent[] {
  return [...state.events.values()].sort((a, b) => (a.id < b.id ? 1 : -1));
}
