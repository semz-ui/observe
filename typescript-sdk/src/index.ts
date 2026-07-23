export interface ObserveConfig {
  /** Project API key (`obs_<random>`), created in the dashboard. */
  apiKey: string;
  /** Base URL of the observe ingestion API, e.g. `https://api.example.com`. */
  apiHost: string;
}

/**
 * Initialise the tracker. M1 stub — real autocapture, identity, and transport
 * arrive in later milestones.
 */
export function init(config: ObserveConfig): void {
  console.log('[observe] init', config.apiHost);
}
