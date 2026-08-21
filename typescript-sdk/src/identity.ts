import { safeStorage } from './storage';

const ANON_KEY = 'obs_anon_id';
const SESSION_ID_KEY = 'obs_session_id';
const SESSION_LAST_KEY = 'obs_session_last';

/**
 * A unique id, degrading gracefully across runtimes. `crypto.randomUUID` is
 * secure-context-only and absent on older engines, so it can be missing (or
 * throw) on an `http://` customer site; `crypto.getRandomValues` works in
 * non-secure contexts; `Math.random` is the last resort. Anonymous analytics
 * ids need uniqueness, not unpredictability, so all three are acceptable — and
 * the server only requires a string ≤ 64 chars, not a UUID shape.
 */
function generateId(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;

  if (c?.randomUUID) {
    try {
      return c.randomUUID();
    } catch {
      // Some engines expose randomUUID but throw outside a secure context.
    }
  }

  if (c?.getRandomValues) {
    const bytes = c.getRandomValues(new Uint8Array(16));
    let hex = '';
    for (const b of bytes) hex += b.toString(16).padStart(2, '0');
    return hex;
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** A persisted anonymous id, created once and reused across sessions. */
export function resolveAnonymousId(): string {
  const existing = safeStorage.get(ANON_KEY);
  if (existing) return existing;

  const id = generateId();
  safeStorage.set(ANON_KEY, id);
  return id;
}

export interface Session {
  id: string;
  /** Epoch ms of the last event; drives the idle-timeout rotation. */
  lastActivity: number;
}

/**
 * Resolve the current session, rotating it when the idle gap since the last
 * activity exceeds `sessionTimeout`. Reads persist across tabs (localStorage),
 * so a session is shared browser-wide. Always refreshes `lastActivity` to now.
 */
export function resolveSession(
  sessionTimeout: number,
  now: number = Date.now(),
): Session {
  const storedId = safeStorage.get(SESSION_ID_KEY);
  const storedLast = safeStorage.get(SESSION_LAST_KEY);
  const lastActivity = storedLast ? Number(storedLast) : NaN;

  let id: string;
  if (storedId && Number.isFinite(lastActivity) && now - lastActivity <= sessionTimeout) {
    id = storedId; // still within the idle window — keep the session
  } else {
    id = generateId(); // expired or first visit — mint a new one
  }

  safeStorage.set(SESSION_ID_KEY, id);
  safeStorage.set(SESSION_LAST_KEY, String(now));
  return { id, lastActivity: now };
}
