import { z } from 'zod';

import { ApiError, apiGet } from '@/shared/api/http';
import { Badge } from '@/shared/ui/badge';

// Temporary, and colocated on purpose: schemas belong in a module's `domain/`,
// but health is not a module and this page dies once M2 gives the dashboard a
// real first screen. It exists to prove the server-side pipe to the API.
const healthSchema = z.object({
  status: z.string(),
  timestamp: z.iso.datetime(),
});

// Always ask the API — a cached "ok" is worse than useless on a health check.
export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  let health: z.infer<typeof healthSchema> | null = null;
  let failure: ApiError | null = null;

  try {
    health = await apiGet('/health', healthSchema);
  } catch (error) {
    // Only an ApiError is expected here; anything else is a real bug and should
    // reach the error boundary rather than be rendered as a status.
    if (!(error instanceof ApiError)) throw error;
    failure = error;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold tracking-tight">API health</h1>
        <Badge variant={health ? 'default' : 'destructive'}>
          {health ? health.status : 'unreachable'}
        </Badge>
      </div>

      {health ? (
        <p className="text-sm text-muted-foreground">
          Answered at{' '}
          <time dateTime={health.timestamp} className="font-mono">
            {health.timestamp}
          </time>
        </p>
      ) : (
        <p className="text-sm text-destructive">{failure?.message}</p>
      )}

      <p className="text-sm text-muted-foreground">
        Fetched server-side through{' '}
        <code className="font-mono">shared/api</code>. The browser never talks
        to the API directly — it sends CORS headers on{' '}
        <code className="font-mono">/v1/events</code> only.
      </p>
    </div>
  );
}
