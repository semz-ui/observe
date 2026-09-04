import { describe, expect, it } from 'vitest';

import type { ClickEvent } from '../domain/event';
import { EMPTY_FEED, absorbHead, absorbPage, feedRows } from './feed-state';

/** Ids are uuid v7 in reality; only their ordering matters here. */
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

const events = (...ids: string[]) => ids.map(event);
const ids = (state: Parameters<typeof feedRows>[0]) =>
  feedRows(state).map((row) => row.id);

describe('feedRows', () => {
  it('returns newest first, counting a repeated id once', () => {
    const state = absorbPage(
      absorbHead(EMPTY_FEED, events('c', 'b')).state,
      events('b', 'a'),
    );

    expect(ids(state)).toEqual(['c', 'b', 'a']);
  });
});

describe('absorbHead', () => {
  it('reports only the ids it has not seen before', () => {
    const first = absorbHead(EMPTY_FEED, events('b', 'a'));
    const second = absorbHead(first.state, events('c', 'b'));

    expect(second.freshIds).toEqual(['c']);
  });

  it('keeps rows that have scrolled out of the polled window', () => {
    // The poll only ever returns the newest page. Anything older that the
    // cursor walk has not reached exists in neither query, so the feed has to
    // remember it or the table loses rows it already showed.
    const first = absorbHead(EMPTY_FEED, events('b', 'a'));
    const second = absorbHead(first.state, events('d', 'c'));

    expect(ids(second.state)).toEqual(['d', 'c', 'b', 'a']);
  });

  it('opens no gap while consecutive ticks still overlap', () => {
    // The case that matters over a long session: the head window slides
    // forward tick after tick, and as long as each one shares a row with what
    // is known, nothing was missed — however far it has slid from the start.
    let state = absorbHead(EMPTY_FEED, events('b', 'a')).state;
    for (const tick of [events('c', 'b'), events('d', 'c'), events('e', 'd')]) {
      state = absorbHead(state, tick).state;
    }

    expect(state.hasGap).toBe(false);
    expect(ids(state)).toEqual(['e', 'd', 'c', 'b', 'a']);
  });

  it('opens a gap when a tick shares nothing with what is known', () => {
    // More than a page arrived between ticks: the events between 'b' and 'e'
    // exist and nothing in this feed has ever fetched them.
    const first = absorbHead(EMPTY_FEED, events('b', 'a'));
    const second = absorbHead(first.state, events('f', 'e'));

    expect(second.state.hasGap).toBe(true);
  });

  it('never opens a gap on the first page', () => {
    expect(absorbHead(EMPTY_FEED, events('b', 'a')).state.hasGap).toBe(false);
  });

  it('keeps a gap once opened', () => {
    // The cursor only walks older, so nothing will ever come back and fill it.
    const gapped = absorbHead(
      absorbHead(EMPTY_FEED, events('a')).state,
      events('z'),
    ).state;

    expect(absorbHead(gapped, events('z')).state.hasGap).toBe(true);
  });
});

describe('absorbPage', () => {
  it('does not treat an older page as newly arrived', () => {
    // "Load more" appends fifty unfamiliar ids. Counting those as new would
    // flash the whole page as though it had just been captured.
    const head = absorbHead(EMPTY_FEED, events('d', 'c'));
    const state = absorbPage(head.state, events('b', 'a'));

    expect(ids(state)).toEqual(['d', 'c', 'b', 'a']);
    expect(state.hasGap).toBe(false);
  });

  it('opens no gap however far the walked page is from the head', () => {
    const head = absorbHead(EMPTY_FEED, events('z'));

    expect(absorbPage(head.state, events('a')).hasGap).toBe(false);
  });
});
