import { describe, expect, it } from 'vitest';

import type { ClickEvent } from '../domain/event';
import { mergeEvents } from './merge-events';

/** Ids are uuid v7 in reality; only their ordering matters to the merge. */
function event(id: string): ClickEvent {
  return {
    id,
    projectId: 'p',
    anonymousId: 'a',
    sessionId: 's',
    url: 'https://example.test/',
    elementTag: 'button',
    elementSelector: 'button',
    timestamp: '2026-09-04T10:00:00.000Z',
  };
}

const ids = (merged: { rows: readonly ClickEvent[] }) =>
  merged.rows.map((row) => row.id);

describe('mergeEvents', () => {
  it('returns newest first, with the overlap counted once', () => {
    const merged = mergeEvents(
      [event('c'), event('b')],
      [event('b'), event('a')],
    );

    expect(ids(merged)).toEqual(['c', 'b', 'a']);
  });

  it('keeps rows the poll no longer returns', () => {
    // Page one has moved on, but a reader who walked the cursor should not
    // watch the bottom of their feed disappear.
    const merged = mergeEvents([event('e'), event('d')], [event('b')]);

    expect(ids(merged)).toEqual(['e', 'd', 'b']);
  });

  it('reports no gap while the two sets still share a row', () => {
    expect(mergeEvents([event('c'), event('b')], [event('b')]).hasGap).toBe(
      false,
    );
  });

  it('reports a gap when the polled head no longer overlaps what was walked', () => {
    // More than a page arrived between ticks: the rows between 'd' and 'b'
    // exist and nothing in this feed has ever fetched them.
    expect(mergeEvents([event('f'), event('e')], [event('b')]).hasGap).toBe(
      true,
    );
  });

  it('reports no gap when either side is empty', () => {
    expect(mergeEvents([], [event('a')]).hasGap).toBe(false);
    expect(mergeEvents([event('a')], []).hasGap).toBe(false);
  });
});
