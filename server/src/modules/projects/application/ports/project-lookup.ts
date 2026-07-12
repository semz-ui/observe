export const PROJECT_LOOKUP = Symbol('ProjectLookup');

// The projects module's public port for the ingestion path: takes the
// PLAINTEXT key and hashes internally, so callers can't skip the hashing
// step. Returns only the id — the narrowest contract that works.
export interface ProjectLookup {
  findProjectIdByApiKey(apiKey: string): Promise<string | null>;
}
