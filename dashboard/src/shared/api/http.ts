// The single door to the observe API. Importing this from a client component is
// a build error, not a runtime one: the API sends CORS headers on /v1/events
// only (server/src/main.ts:12), so browser JS cannot read /api/* or /v1/stats at
// all. Everything goes through a server component or a route handler.
import 'server-only';

import type { ZodType } from 'zod';

/**
 * A failed API call. `status` is 0 when the request never reached the API at
 * all — a DNS failure, a refused connection, the usual "is the server running?"
 * case — so callers can tell "the API said no" from "there was no API".
 *
 * `details` keeps the individual class-validator strings for a 400, for forms
 * that want to show them per field. `message` is always a single string.
 */
export class ApiError extends Error {
  // Declared as plain fields rather than TS parameter properties: those are a
  // TypeScript *emit* feature, so they break any type-stripping runtime.
  readonly status: number;
  readonly details?: readonly string[];

  constructor(
    status: number,
    message: string,
    options?: { details?: readonly string[]; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ApiError';
    this.status = status;
    this.details = options?.details;
  }

  /** No API to talk to, as opposed to an API that rejected us. */
  get isUnreachable(): boolean {
    return this.status === 0;
  }
}

function baseUrl(): string {
  const url = process.env.OBSERVE_API_URL;
  if (!url) {
    // Fail loudly at the first call rather than producing "fetch failed" against
    // the string "undefined/api/projects".
    throw new Error(
      'OBSERVE_API_URL is not set — copy .env.example to .env.local',
    );
  }
  return url.replace(/\/+$/, '');
}

type QueryValue = string | number | boolean | undefined | null;

/**
 * Undefined and null params are dropped rather than serialised. This is load
 * bearing for the events feed: `cursor` is validated as a UUID, so sending it
 * empty on the first page is a 400 rather than "start from the beginning".
 */
function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${baseUrl()}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** The error body Nest's default exception filter produces. */
interface NestErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Nest reports validation failures as `message: string[]` and everything else as
 * `message: string`. Collapsing that here is the whole point of this module —
 * no caller should have to know the shape, let alone branch on it.
 */
function describeError(
  body: unknown,
  res: Response,
): { message: string; details?: string[] } {
  if (!isRecord(body)) return { message: `${res.status} ${res.statusText}` };

  const { message, error } = body as NestErrorBody;

  if (Array.isArray(message) && message.length > 0) {
    return { message: message.join('; '), details: message };
  }
  if (typeof message === 'string' && message.length > 0) {
    return { message };
  }
  if (typeof error === 'string' && error.length > 0) {
    return { message: error };
  }
  return { message: `${res.status} ${res.statusText}` };
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // A proxy or a crash can return HTML where JSON was promised; surface the
    // start of it rather than a bare "Unexpected token <".
    throw new ApiError(
      res.status,
      `expected JSON from ${res.url} but got: ${text.slice(0, 120)}`,
    );
  }
}

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  /**
   * Seconds to cache the response for. Omitted means uncached: Next 16 does not
   * cache `fetch` by default, and analytics reads should be live. Worth setting
   * only for genuinely slow-moving data.
   */
  revalidate?: number;
  signal?: AbortSignal;
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  schema: ZodType<T>,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
      ...(options.revalidate === undefined
        ? {}
        : { next: { revalidate: options.revalidate } }),
    });
  } catch (cause) {
    throw new ApiError(
      0,
      `cannot reach the observe API at ${baseUrl()} — is it running?`,
      { cause },
    );
  }

  const payload = await readJson(res);

  if (!res.ok) {
    const { message, details } = describeError(payload, res);
    throw new ApiError(res.status, message, { details });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    // A 2xx whose shape we don't recognise means the API moved under us. That is
    // a different bug from a 4xx, so say so plainly instead of letting an
    // undefined field surface three layers up.
    const where = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new ApiError(
      res.status,
      `unexpected response shape from ${method} ${path} — ${where}`,
    );
  }

  return parsed.data;
}

export function apiGet<T>(
  path: string,
  schema: ZodType<T>,
  options?: RequestOptions,
): Promise<T> {
  return request('GET', path, schema, undefined, options);
}

export function apiPost<T>(
  path: string,
  schema: ZodType<T>,
  body: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request('POST', path, schema, body, options);
}
