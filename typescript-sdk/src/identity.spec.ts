import { beforeEach, describe, expect, it } from 'vitest';
import { resolveAnonymousId, resolveSession } from './identity';

const ANON_KEY = 'obs_anon_id';
const SESSION_ID_KEY = 'obs_session_id';
const SESSION_LAST_KEY = 'obs_session_last';

const THIRTY_MIN = 30 * 60_000;

describe('resolveAnonymousId', () => {
  beforeEach(() => localStorage.clear());

  it('mints an id once and reuses it', () => {
    const first = resolveAnonymousId();
    const second = resolveAnonymousId();

    expect(first).toEqual(second);
    expect(localStorage.getItem(ANON_KEY)).toBe(first);
  });

  it('reuses an id persisted by an earlier visit', () => {
    localStorage.setItem(ANON_KEY, 'previous-visit');

    expect(resolveAnonymousId()).toBe('previous-visit');
  });

  it('fits the server cap of 64 characters', () => {
    expect(resolveAnonymousId().length).toBeLessThanOrEqual(64);
  });
});

describe('resolveSession', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the session while activity stays inside the idle window', () => {
    const start = 1_700_000_000_000;
    const first = resolveSession(THIRTY_MIN, start);
    const later = resolveSession(THIRTY_MIN, start + 29 * 60_000);

    expect(later.id).toBe(first.id);
    expect(later.lastActivity).toBe(start + 29 * 60_000);
  });

  it('rotates the session once the idle gap exceeds the timeout', () => {
    const start = 1_700_000_000_000;
    const first = resolveSession(THIRTY_MIN, start);
    const after = resolveSession(THIRTY_MIN, start + THIRTY_MIN + 1);

    expect(after.id).not.toBe(first.id);
  });

  it('refreshes lastActivity on every call, so a busy visit never rotates', () => {
    const start = 1_700_000_000_000;
    const first = resolveSession(THIRTY_MIN, start);

    // Twenty minutes of clicks, twenty minutes apart each time.
    let current = first;
    for (let i = 1; i <= 3; i++) {
      current = resolveSession(THIRTY_MIN, start + i * 20 * 60_000);
    }

    expect(current.id).toBe(first.id);
    expect(localStorage.getItem(SESSION_LAST_KEY)).toBe(String(start + 3 * 20 * 60_000));
  });

  it('mints a new session when the stored timestamp is corrupt', () => {
    localStorage.setItem(SESSION_ID_KEY, 'stored-session');
    localStorage.setItem(SESSION_LAST_KEY, 'not-a-number');

    expect(resolveSession(THIRTY_MIN).id).not.toBe('stored-session');
  });
});
