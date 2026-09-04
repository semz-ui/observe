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
    // Pass the API's own status through, except for "no API at all", which is
    // this server's problem to report rather than a status the client can act on.
    return NextResponse.json(
      { message: error.message },
      { status: error.isUnreachable ? 502 : error.status },
    );
  }
}
