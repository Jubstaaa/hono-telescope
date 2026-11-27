import { StrictMode } from 'react'
import { RouterProvider } from 'react-router'

import { QueryProvider } from './query-provider'
import { router } from './routes/router'
import { ThemeProvider } from './theme-context'

function App() {
    return (
        <StrictMode>
            <QueryProvider>
                <ThemeProvider>
                    <RouterProvider router={router} />
                </ThemeProvider>
            </QueryProvider>
        </StrictMode>
    )
}

export default App
