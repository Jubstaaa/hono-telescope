import type { ReactNode } from 'react';
import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Telescope runs next to the app it observes, so a failed request is shown at once with a
// Retry button rather than retried silently in the background.
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
