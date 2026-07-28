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

export const safeStorage = {
  get(key: string): string | null {
    try {
      return getBackend().get(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      getBackend().set(key, value);
    } catch {
      // Persistence is best-effort — a full quota or a late failure is non-fatal.
    }
  },
};
