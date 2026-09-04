'use client';

import { Button } from '@/shared/ui/button';

/**
 * Where a thrown ApiError lands. This is the other half of http.ts throwing
 * rather than returning a Result: a Server Component read needs no error
 * branch of its own, because a failure arrives here instead.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="flex max-w-2xl flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">
          Something went wrong
        </h1>
        {/*
          Next replaces the message with a digest in production, so this is a
          development affordance. The user-facing signal is the button.
        */}
        <p className="text-sm text-muted-foreground">
          {error.message || 'The dashboard could not load this page.'}
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
