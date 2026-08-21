/**
 * Delivery of a batch to `POST /v1/events`. Two paths, because the browser
 * gives us two very different budgets:
 *
 * - {@link sendBatch} — the normal case, an awaited `fetch`, so the queue
 *   learns whether to retry.
 * - {@link sendBeaconBatch} — the page is unloading; nothing can be awaited, so
 *   we hand the request to the browser and hope. Fire-and-forget by design.
 *
 * The API key travels in the *body*, not a header: `sendBeacon` can't set
 * headers, which is exactly why the server's DTO takes `apiKey` as a field.
 */

import type { ClickEvent, ResolvedConfig } from './types';

/** The server rejects batches over 100 events (`@ArrayMaxSize(100)`). */
export const MAX_BATCH = 100;

function endpoint(config: ResolvedConfig): string {
  return `${config.apiHost.replace(/\/+$/, '')}/v1/events`;
}

function payload(config: ResolvedConfig, events: ClickEvent[]): string {
  return JSON.stringify({ apiKey: config.apiKey, events });
}

/**
 * Send a batch and report whether the queue may drop it.
 *
 * `true` means "done with these events" — which includes a 4xx: a rejected key
 * or an invalid payload will be rejected identically forever, so retrying only
 * burns the user's bandwidth. Only network errors and 5xx return `false`.
 */
export async function sendBatch(
  config: ResolvedConfig,
  events: ClickEvent[],
): Promise<boolean> {
  if (typeof fetch !== 'function') return false;

  try {
    const response = await fetch(endpoint(config), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload(config, events),
      // The key authenticates the request; cookies would only invite CORS pain.
      credentials: 'omit',
      mode: 'cors',
    });

    if (response.ok) return true;

    if (response.status >= 400 && response.status < 500) {
      console.warn(
        `[observe] server rejected ${events.length} event(s) with ${response.status}; dropping them`,
      );
      return true;
    }

    return false; // 5xx — the next flush retries
  } catch {
    return false; // offline, DNS failure, CORS rejection
  }
}

/**
 * Last-gasp delivery during page teardown. `sendBeacon` queues the request with
 * the browser and returns immediately; if it refuses (its queue is full, or the
 * body is over the ~64 KB limit), fall back to a `keepalive` fetch, which also
 * outlives the document.
 */
export function sendBeaconBatch(config: ResolvedConfig, events: ClickEvent[]): boolean {
  const url = endpoint(config);
  const body = payload(config, events);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // A JSON blob costs a CORS preflight, which the server allows on
      // /v1/events; text/plain would skip it but Nest wouldn't parse the body.
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return true;
    }
  } catch {
    // Some engines throw instead of returning false — treat it as a refusal.
  }

  try {
    if (typeof fetch !== 'function') return false;
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      credentials: 'omit',
      mode: 'cors',
      keepalive: true,
    }).catch(() => {
      // Nothing to do — the page is on its way out.
    });
    return true;
  } catch {
    return false;
  }
}
