import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(
        () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
    )

    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
