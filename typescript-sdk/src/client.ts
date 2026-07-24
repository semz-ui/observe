import type { ObserveConfig, ResolvedConfig } from './types';
import { resolveAnonymousId, resolveSession, type Session } from './identity';

const DEFAULTS = {
  flushInterval: 5000,
  batchSize: 20,
  sessionTimeout: 30 * 60_000,
} as const;

/** The single per-page tracker. `null` until {@link init} runs. Queue and flush
 *  timer join this in M2b. */
export interface ClientState {
  config: ResolvedConfig;
  anonymousId: string;
  session: Session;
}

let state: ClientState | null = null;

function resolveConfig(config: ObserveConfig): ResolvedConfig {
  return {
    apiKey: config.apiKey,
    apiHost: config.apiHost,
    flushInterval: config.flushInterval ?? DEFAULTS.flushInterval,
    batchSize: config.batchSize ?? DEFAULTS.batchSize,
    sessionTimeout: config.sessionTimeout ?? DEFAULTS.sessionTimeout,
  };
}

/** Initialise the tracker. Idempotent: a second call is ignored so a page only
 *  ever has one tracker. */
export function init(config: ObserveConfig): void {
  if (state) return;

  if (!config.apiKey || !config.apiHost) {
    console.warn('[observe] init requires both apiKey and apiHost; ignoring init()');
    return;
  }

  const resolved = resolveConfig(config);
  state = {
    config: resolved,
    anonymousId: resolveAnonymousId(),
    session: resolveSession(resolved.sessionTimeout),
  };
}

/** Access the live state; throws if used before {@link init}. */
export function getState(): ClientState {
  if (!state) throw new Error('[observe] init() must be called before use');
  return state;
}

export function getConfig(): ResolvedConfig {
  return getState().config;
}
