import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** storage.ts caches its backend in a module-level variable, so every test
 *  needs a fresh module instance. */
async function freshStorage() {
  vi.resetModules();
  return (await import('./storage')).safeStorage;
}

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads and writes through localStorage when it works', async () => {
    const storage = await freshStorage();

    storage.set('k', 'v');

    expect(storage.get('k')).toBe('v');
    expect(localStorage.getItem('k')).toBe('v');
  });

  it('returns null for a missing key', async () => {
    const storage = await freshStorage();

    expect(storage.get('nope')).toBeNull();
  });

  it('falls back to memory when the probe fails (private mode)', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    const storage = await freshStorage();
    storage.set('k', 'v');

    // The value survives in memory even though localStorage never took it.
    expect(storage.get('k')).toBe('v');
    expect(localStorage.getItem('k')).toBeNull();
  });

  it('switches to memory when localStorage starts throwing mid-session', async () => {
    const storage = await freshStorage();
    storage.set('first', '1'); // probe passes, backend is localStorage

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    storage.set('second', '2');

    expect(storage.get('second')).toBe('2'); // served from memory now
    expect(localStorage.getItem('second')).toBeNull();
  });
});
