/** Options passed to {@link init}. Only `apiKey` and `apiHost` are required; the
 *  rest fall back to the defaults resolved in `client.ts`. */
export interface ObserveConfig {
  /** Project API key (`obs_<random>`), created in the dashboard. */
  apiKey: string;
  /** Base URL of the observe ingestion API, e.g. `https://api.example.com`. */
  apiHost: string;
  /** Flush the queue at least this often, in ms. Default 5000. */
  flushInterval?: number;
  /** Flush once the queue reaches this many events. Default 20. */
  batchSize?: number;
  /** Idle gap after which a new session is minted, in ms. Default 30 min. */
  sessionTimeout?: number;
}

/** {@link ObserveConfig} with every optional field filled in — what the client
 *  actually runs on. */
export type ResolvedConfig = Required<ObserveConfig>;

/** A single captured event. Mirrors the server's `ClickEventDto`: the first six
 *  fields are required, the rest optional. Identity (`anonymousId`,
 *  `sessionId`) is stamped by the SDK; autocapture (M3) fills the `element*`
 *  fields. */
export interface ClickEvent {
  anonymousId: string;
  sessionId: string;
  url: string;
  elementTag: string;
  elementSelector: string;
  /** ISO-8601 string (the server validates with `@IsISO8601`). */
  timestamp: string;
  pageTitle?: string;
  elementId?: string;
  elementText?: string;
  elementHref?: string;
}
