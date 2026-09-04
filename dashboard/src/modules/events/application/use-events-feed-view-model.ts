'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  EVENTS_PAGE_SIZE,
  type ClickEvent,
  type RecentEventsPage,
} from '../domain/event';
import { fetchRecentEvents } from '../infrastructure/events.client';
import { mergeEvents } from './merge-events';

export const POLL_INTERVAL_MS = 5_000;

export interface EventsFeedViewState {
  readonly rows: readonly ClickEvent[];
  /** Ids that arrived on the last tick — the view flashes these. */
  readonly newIds: ReadonlySet<string>;
  readonly isEmpty: boolean;
  readonly isLoading: boolean;
  readonly isPaused: boolean;
  readonly isFetchingNewer: boolean;
  readonly canLoadMore: boolean;
  readonly isLoadingMore: boolean;
  readonly hasGap: boolean;
  readonly errorMessage: string | null;
  readonly togglePause: () => void;
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
  const [isPaused, setIsPaused] = useState(false);
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
    refetchInterval: isPaused ? false : POLL_INTERVAL_MS,
  });

  const walked = useMemo(
    () => pages.data.pages.flatMap((page) => page.events),
    [pages.data],
  );

  const { rows, hasGap } = useMemo(
    () => mergeEvents(head.data.events, walked),
    [head.data, walked],
  );

  // Everything on screen at mount counts as already seen, so the feed does not
  // flash its whole first page at you.
  const seen = useRef(new Set(rows.map((event) => event.id)));

  useEffect(() => {
    const fresh = rows
      .filter((event) => !seen.current.has(event.id))
      .map((event) => event.id);
    if (fresh.length === 0) return;
    for (const id of fresh) seen.current.add(id);
    setNewIds(new Set(fresh));
  }, [rows]);

  const togglePause = useCallback(() => {
    setIsPaused((paused) => !paused);
  }, []);

  const loadMore = useCallback(() => {
    void pages.fetchNextPage();
  }, [pages]);

  const failure = head.error ?? pages.error;

  return {
    rows,
    newIds,
    isEmpty: rows.length === 0,
    isLoading: pages.isPending,
    isPaused,
    isFetchingNewer: head.isFetching,
    canLoadMore: pages.hasNextPage,
    isLoadingMore: pages.isFetchingNextPage,
    hasGap,
    errorMessage: failure === null ? null : failure.message,
    togglePause,
    loadMore,
  };
}
