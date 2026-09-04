'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * How often the events feed asks for the head of the list. Anything faster than
 * a couple of seconds is asking the API for rows that mostly have not changed;
 * anything slower stops feeling live.
 */
export const POLL_INTERVAL_OPTIONS = [2_000, 5_000, 15_000, 60_000] as const;

export type PollIntervalMs = (typeof POLL_INTERVAL_OPTIONS)[number];

export const DEFAULT_POLL_INTERVAL_MS: PollIntervalMs = 5_000;

interface FeedPreferences {
  readonly isPaused: boolean;
  readonly pollIntervalMs: PollIntervalMs;
  readonly togglePause: () => void;
  readonly setPollInterval: (pollIntervalMs: PollIntervalMs) => void;
}

/**
 * Per-user preferences for the feed, and the only state in the dashboard that
 * belongs in a store.
 *
 * The split this file draws, and the reason it is worth having at all:
 *
 * - **Server state** — projects, events, stats — belongs to TanStack Query. It
 *   is a cache of someone else's data, not state we own.
 * - **Addressable state** — which project is in scope — belongs in the URL, so
 *   a link is worth sending.
 * - **Preferences** — pause, poll interval — belong here: they outlive the
 *   component that sets them, follow the reader between pages, and nobody wants
 *   them in a link.
 * - **Ephemera** — a menu being open, which row's dialog is showing — stay in
 *   the component. Lifting those into a store is how a store becomes a dumping
 *   ground.
 */
export const useFeedPreferences = create<FeedPreferences>()(
  persist(
    (set) => ({
      isPaused: false,
      pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      togglePause: () => {
        set((state) => ({ isPaused: !state.isPaused }));
      },
      setPollInterval: (pollIntervalMs) => {
        set({ pollIntervalMs });
      },
    }),
    {
      name: 'observe.feed-preferences',
      storage: createJSONStorage(() => localStorage),
      // Actions are recreated on every load; only the values are worth keeping.
      partialize: ({ isPaused, pollIntervalMs }) => ({
        isPaused,
        pollIntervalMs,
      }),
      // Hydrating automatically would make the first client render disagree
      // with the server's, which rendered with the defaults. Rehydrate after
      // mount instead — see useFeedPreferencesHydration.
      skipHydration: true,
    },
  ),
);

/**
 * Applies the stored preferences once the component tree is mounted. Call it
 * from the screen that reads them; calling it twice is harmless.
 */
export function useFeedPreferencesHydration(): void {
  useEffect(() => {
    void useFeedPreferences.persist.rehydrate();
  }, []);
}
