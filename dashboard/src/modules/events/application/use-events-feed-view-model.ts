'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useFeedPreferences,
  type PollIntervalMs,
} from '@/shared/store/feed-preferences';

import {
  EVENTS_PAGE_SIZE,
  type ClickEvent,
  type RecentEventsPage,
} from '../domain/event';
import { fetchRecentEvents } from '../infrastructure/events.client';
import {
  EMPTY_FEED,
  absorbHead,
  absorbPage,
  feedRows,
  type FeedState,
} from './feed-state';

export interface EventsFeedViewState {
  readonly rows: readonly ClickEvent[];
  /** Ids that arrived on the last tick — the view flashes these. */
  readonly newIds: ReadonlySet<string>;
  readonly isEmpty: boolean;
  readonly isLoading: boolean;
  readonly isPaused: boolean;
  readonly pollIntervalMs: PollIntervalMs;
  readonly isFetchingNewer: boolean;
  readonly canLoadMore: boolean;
  readonly isLoadingMore: boolean;
  readonly hasGap: boolean;
  readonly errorMessage: string | null;
  readonly togglePause: () => void;
  readonly setPollInterval: (pollIntervalMs: PollIntervalMs) => void;
  readonly loadMore: () => void;
}

/**
 * The reference ViewModel: every piece of client state the feed has lives here,
 * and not one line of JSX does.
 *
 * Two queries rather than one. The infinite query owns the cursor walk and is
 * never refetched — walking backwards through a keyset is a one-way trip, and
 * re-running it would cost one request per loaded page. A second query polls
 * the head of the feed, and `mergeEvents` reconciles the two. That way a tick
 * is one request whether you are on page one or page ten, and paging deeper
 * never resets.
 */
export function useEventsFeedViewModel({
  projectId,
  initialPage,
}: {
  projectId: string;
  initialPage: RecentEventsPage;
}): EventsFeedViewState {
  // Pause and interval are preferences, not view state: they outlive this
  // screen and follow the reader between projects, so they live in the store
  // rather than in a useState that resets on every navigation.
  const isPaused = useFeedPreferences((state) => state.isPaused);
  const pollIntervalMs = useFeedPreferences((state) => state.pollIntervalMs);
  const togglePause = useFeedPreferences((state) => state.togglePause);
  const setPollInterval = useFeedPreferences((state) => state.setPollInterval);

  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set());

  const pages = useInfiniteQuery({
    queryKey: ['events', projectId, 'pages'],
    queryFn: ({ pageParam, signal }) =>
      fetchRecentEvents(
        { projectId, limit: EVENTS_PAGE_SIZE, cursor: pageParam },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    // First paint comes from the server component, so the table has rows before
    // the browser has made a single request.
    initialData: { pages: [initialPage], pageParams: [undefined] },
    staleTime: Infinity,
  });

  const head = useQuery({
    queryKey: ['events', projectId, 'head'],
    queryFn: ({ signal }) =>
      fetchRecentEvents({ projectId, limit: EVENTS_PAGE_SIZE }, signal),
    initialData: initialPage,
    // `refetchIntervalInBackground` defaults to false, so a hidden tab stops
    // polling on its own — no visibility listener needed here.
    refetchInterval: isPaused ? false : pollIntervalMs,
  });

  const walked = useMemo(
    () => pages.data.pages.flatMap((page) => page.events),
    [pages.data],
  );

  // Held in a ref and mutated by the two effects below rather than derived on
  // every render: the feed is the accumulation of every window either query has
  // reported, and a `useMemo` over the current windows would drop whatever has
  // scrolled out of both.
  const seeded = useMemo<FeedState>(
    () => absorbPage(EMPTY_FEED, initialPage.events),
    [initialPage],
  );
  const feed = useRef<FeedState>(seeded);
  const [view, setView] = useState(() => ({
    rows: feedRows(seeded),
    hasGap: seeded.hasGap,
  }));

  const publish = useCallback(() => {
    setView({ rows: feedRows(feed.current), hasGap: feed.current.hasGap });
  }, []);

  useEffect(() => {
    const { state, freshIds } = absorbHead(feed.current, head.data.events);
    feed.current = state;
    publish();
    // An empty set every tick would re-render the whole table to say nothing.
    if (freshIds.length > 0) setNewIds(new Set(freshIds));
  }, [head.data, publish]);

  useEffect(() => {
    feed.current = absorbPage(feed.current, walked);
    publish();
  }, [walked, publish]);

  const loadMore = useCallback(() => {
    void pages.fetchNextPage();
  }, [pages]);

  const failure = head.error ?? pages.error;

  return {
    rows: view.rows,
    newIds,
    isEmpty: view.rows.length === 0,
    isLoading: pages.isPending,
    isPaused,
    pollIntervalMs,
    isFetchingNewer: head.isFetching,
    canLoadMore: pages.hasNextPage,
    isLoadingMore: pages.isFetchingNextPage,
    hasGap: view.hasGap,
    errorMessage: failure === null ? null : failure.message,
    togglePause,
    setPollInterval,
    loadMore,
  };
}
