import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Just enough of the Storage interface for zustand's persist middleware. */
function memoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  };
}

// The store is built at import time, and `createJSONStorage` resolves
// localStorage right then — so the stub has to be in place before the module
// loads, which is what the dynamic import buys. Without it zustand quietly
// drops the persist middleware and the store still "works", just without ever
// remembering anything.
const storage = memoryStorage();
vi.stubGlobal('localStorage', storage);
const { DEFAULT_POLL_INTERVAL_MS, useFeedPreferences } =
  await import('./feed-preferences');

const read = () => useFeedPreferences.getState();

// Held by reference rather than read off the global: `unstubGlobals` clears the
// stub after every test, while the store keeps the object it resolved at import.
beforeEach(() => {
  storage.clear();
  useFeedPreferences.setState({
    isPaused: false,
    pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
  });
});

describe('feed preferences', () => {
  it('starts live, at the default interval', () => {
    expect(read().isPaused).toBe(false);
    expect(read().pollIntervalMs).toBe(5_000);
  });

  it('toggles pause both ways', () => {
    read().togglePause();
    expect(read().isPaused).toBe(true);

    read().togglePause();
    expect(read().isPaused).toBe(false);
  });

  it('sets the poll interval without touching pause', () => {
    read().togglePause();
    read().setPollInterval(15_000);

    expect(read().pollIntervalMs).toBe(15_000);
    expect(read().isPaused).toBe(true);
  });

  it('applies values from a previous session only once rehydrated', async () => {
    // Seeded directly rather than by driving the store: every `set` writes
    // through the middleware, so resetting the state to fake a reload would
    // overwrite the very thing under test.
    storage.setItem(
      'observe.feed-preferences',
      JSON.stringify({ state: { isPaused: true, pollIntervalMs: 60_000 } }),
    );

    // `skipHydration` is what keeps the first client render matching the
    // server's, so nothing is applied yet.
    expect(read().isPaused).toBe(false);
    expect(read().pollIntervalMs).toBe(DEFAULT_POLL_INTERVAL_MS);

    await useFeedPreferences.persist.rehydrate();

    expect(read().isPaused).toBe(true);
    expect(read().pollIntervalMs).toBe(60_000);
  });

  it('stores the values and not the actions', () => {
    read().setPollInterval(2_000);

    const written: unknown = JSON.parse(
      storage.getItem('observe.feed-preferences') ?? 'null',
    );

    expect(written).toMatchObject({
      state: { isPaused: false, pollIntervalMs: 2_000 },
    });
  });
});
