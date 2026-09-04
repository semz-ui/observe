'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * One QueryClient per browser session, created in state rather than at module
 * scope: a module-level client would be shared between requests on the server
 * and leak one user's data into another's render.
 */
export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The feed decides its own polling. Everything else is read once
            // and left alone until something invalidates it.
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
