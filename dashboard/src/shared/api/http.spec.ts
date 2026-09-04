import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiError, apiGet } from './http';

const projectSchema = z.object({ id: z.string() });

/** A response shaped the way the API really sends one. */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Typed so `mock.calls` stays typed — an untyped vi.fn() would be `any`. */
function stubFetch(response: Response | Error) {
  const mock =
    response instanceof Error
      ? vi.fn<typeof fetch>().mockRejectedValue(response)
      : vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', mock);
  return mock;
}

/**
 * Awaits a call that is expected to fail and hands back the ApiError, so a test
 * can assert on several of its fields without repeating the request.
 */
async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  const outcome: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(outcome).toBeInstanceOf(ApiError);
  return outcome as ApiError;
}

beforeEach(() => {
  // Nothing loads .env.local under vitest, and baseUrl() throws without it —
  // before any assertion below would get a chance to run.
  vi.stubEnv('OBSERVE_API_URL', 'http://api.test');
});

describe('apiGet', () => {
  it('returns the parsed body on success', async () => {
    stubFetch(json({ id: 'proj_1' }));

    await expect(apiGet('/api/projects', projectSchema)).resolves.toEqual({
      id: 'proj_1',
    });
  });

  it('drops undefined query params rather than serialising them', async () => {
    // Load bearing for the events feed: `cursor` is validated as a UUID, so an
    // empty one on the first page is a 400 rather than "start from the top".
    const fetchMock = stubFetch(json({ id: 'proj_1' }));

    await apiGet('/v1/events/recent', projectSchema, {
      query: { projectId: 'proj_1', limit: 50, cursor: undefined },
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://api.test/v1/events/recent?projectId=proj_1&limit=50',
    );
  });
});

describe('ApiError', () => {
  it('flattens a Nest validation error into one message, keeping the parts', async () => {
    const messages = [
      'name must be longer than or equal to 1 characters',
      'name should not be empty',
    ];
    stubFetch(
      json({ statusCode: 400, message: messages, error: 'Bad Request' }, 400),
    );

    const error = await expectApiError(apiGet('/api/projects', projectSchema));

    expect(error.status).toBe(400);
    expect(error.message).toBe(
      'name must be longer than or equal to 1 characters; name should not be empty',
    );
    // Kept as an array so a form can show them per field.
    expect(error.details).toEqual(messages);
  });

  it('carries a plain-string message through unchanged, with no details', async () => {
    // Every status but 400 sends `message` as a string. Collapsing that union is
    // the whole reason http.ts exists.
    stubFetch(
      json(
        {
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        },
        500,
      ),
    );

    const error = await expectApiError(apiGet('/api/projects', projectSchema));

    expect(error.status).toBe(500);
    expect(error.message).toBe('Internal server error');
    expect(error.details).toBeUndefined();
  });

  it('reports a refused connection as unreachable, not as a failed request', async () => {
    const cause = new TypeError('fetch failed');
    stubFetch(cause);

    const error = await expectApiError(apiGet('/api/projects', projectSchema));

    expect(error.status).toBe(0);
    expect(error.isUnreachable).toBe(true);
    expect(error.message).toContain('http://api.test');
    expect(error.cause).toBe(cause);
  });

  it('rejects a 2xx whose shape does not match the schema', async () => {
    // The API moving under us is a different bug from a 4xx, and the only thing
    // that catches it is the parse at this boundary.
    stubFetch(json({ id: 42 }));

    const error = await expectApiError(apiGet('/api/projects', projectSchema));

    expect(error.status).toBe(200);
    expect(error.message).toContain('unexpected response shape');
    expect(error.message).toContain('id');
  });
});
