/**
 * A best-effort key/value store over `localStorage`, falling back to an
 * in-memory map when storage is unavailable (private mode, disabled cookies,
 * or a throwing `setItem`). The backend is detected once, lazily, on first use.
 */

interface Backend {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

function memoryBackend(): Backend {
  const map = new Map<string, string>();
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value);
    },
  };
}

function detectBackend(): Backend {
  try {
    const probe = '__obs_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return {
      get: (key) => localStorage.getItem(key),
      set: (key, value) => localStorage.setItem(key, value),
    };
  } catch {
    // localStorage is missing or throws (e.g. Safari private mode) — stay in memory.
    return memoryBackend();
  }
}

let backend: Backend | null = null;

function getBackend(): Backend {
  return (backend ??= detectBackend());
}

/** Swap the cached backend to memory. Called when the detected localStorage
 *  backend starts throwing *after* the probe passed (e.g. quota fills mid-
 *  session), so subsequent reads/writes stop hitting the broken store. */
function fallToMemory(): Backend {
  return (backend = memoryBackend());
}

export const safeStorage = {
  get(key: string): string | null {
    try {
      return getBackend().get(key);
    } catch {
      return fallToMemory().get(key); // memory backend never throws
    }
  },
  set(key: string, value: string): void {
    try {
      getBackend().set(key, value);
    } catch {
      fallToMemory().set(key, value); // retry in memory; persistence is best-effort
    }
  },
};
