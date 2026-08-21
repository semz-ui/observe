import type { ClickEvent, ObserveConfig, ResolvedConfig } from './types';
import { resolveAnonymousId, resolveSession, type Session } from './identity';
import { createQueue, type EventQueue } from './queue';
import { describeClick, onDocumentClick } from './capture';
import { onPageHide } from './lifecycle';

const DEFAULTS = {
  flushInterval: 5000,
  batchSize: 20,
  sessionTimeout: 30 * 60_000,
} as const;

/** The single per-page tracker. `null` until {@link init} runs. */
export interface ClientState {
  config: ResolvedConfig;
  anonymousId: string;
  session: Session;
  queue: EventQueue;
  /** Listener teardown, run by {@link stop}. */
  detach: Array<() => void>;
}

let state: ClientState | null = null;

/** Accept an override only if it's a finite positive number; otherwise fall
 *  back to the default. Guards against NaN / Infinity / 0 / negatives, any of
 *  which would break flush timing or session rotation. */
function positiveOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function resolveConfig(config: ObserveConfig): ResolvedConfig {
  return {
    apiKey: config.apiKey,
    apiHost: config.apiHost,
    flushInterval: positiveOr(config.flushInterval, DEFAULTS.flushInterval),
    batchSize: positiveOr(config.batchSize, DEFAULTS.batchSize),
    sessionTimeout: positiveOr(config.sessionTimeout, DEFAULTS.sessionTimeout),
  };
}

/**
 * Turn a click into a queued event. Every click also counts as activity, so the
 * session is re-resolved: that refreshes its idle window and rotates the id
 * once a visitor has been away longer than `sessionTimeout`.
 */
function captureClick(el: Element): void {
  if (!state) return;

  state.session = resolveSession(state.config.sessionTimeout);

  const event: ClickEvent = {
    anonymousId: state.anonymousId,
    sessionId: state.session.id,
    ...describeClick(el),
  };
  state.queue.enqueue(event);
}

/** Initialise the tracker. Idempotent: a second call is ignored so a page only
 *  ever has one tracker. */
export function init(config: ObserveConfig): void {
  if (state) return;

  if (!config.apiKey || !config.apiHost) {
    console.warn('[observe] init requires both apiKey and apiHost; ignoring init()');
    return;
  }

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    console.warn('[observe] no DOM available; ignoring init()');
    return;
  }

  try {
    const resolved = resolveConfig(config);
    state = {
      config: resolved,
      anonymousId: resolveAnonymousId(),
      session: resolveSession(resolved.sessionTimeout),
      queue: createQueue(resolved),
      detach: [],
    };

    state.detach.push(
      onDocumentClick((el) => {
        try {
          captureClick(el);
        } catch (err) {
          // A click handler that throws would surface as a page error and could
          // break the site's own handlers — swallow it.
          console.warn('[observe] failed to capture a click', err);
        }
      }),
    );
    state.detach.push(onPageHide(() => state?.queue.flushOnExit()));
  } catch (err) {
    // Identity/storage resolution must never crash a customer's page — degrade
    // to a no-op tracker the same way a missing config does.
    console.warn('[observe] init failed; tracking disabled', err);
    state = null;
  }
}

/** Send everything buffered right now. Resolves when the request settles; a
 *  no-op before {@link init}. */
export function flush(): Promise<void> {
  return state ? state.queue.flush() : Promise.resolve();
}

/** Detach listeners, make a final best-effort send, and reset — after this
 *  {@link init} can run again. Mainly for SPAs tearing down and for tests. */
export function stop(): void {
  if (!state) return;

  for (const detach of state.detach) detach();
  state.queue.flushOnExit();
  state.queue.stop();
  state = null;
}

/** Access the live state; throws if used before {@link init}. */
export function getState(): ClientState {
  if (!state) throw new Error('[observe] init() must be called before use');
  return state;
}

export function getConfig(): ResolvedConfig {
  return getState().config;
}
