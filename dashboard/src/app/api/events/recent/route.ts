import { NextResponse } from 'next/server';

import { recentEvents } from '@/modules/events';
import { ApiError } from '@/shared/api/http';

/**
 * The BFF edge, and the only one in the dashboard. It exists because the feed
 * *polls*: a Server Component renders once and cannot refresh on an interval,
 * and the browser cannot reach the API itself — CORS headers are sent on
 * POST /v1/events only (`server/src/main.ts:12`).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const params = new URL(request.url).searchParams;
  const projectId = params.get('projectId');

  if (projectId === null) {
    return NextResponse.json(
      { message: 'projectId is required' },
      { status: 400 },
    );
  }

  const limit = params.get('limit');
  const cursor = params.get('cursor');

  try {
    const page = await recentEvents({
      projectId,
      limit: limit === null ? undefined : Number(limit),
      cursor: cursor ?? undefined,
    });
    return NextResponse.json(page);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    if (error.isUnreachable) {
      // The unreachable message names OBSERVE_API_URL, which is an internal
      // address the browser has no business learning. It goes to the server log
      // instead; the client gets a status it can act on and nothing else.
      console.error('observe API unreachable', error);
      return NextResponse.json(
        { message: 'the events API is unavailable' },
        { status: 502 },
      );
    }

    // A real 4xx/5xx came from the API, so its own message is both safe and
    // more useful than anything this handler could invent.
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
}
