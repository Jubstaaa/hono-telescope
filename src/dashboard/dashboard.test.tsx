import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
// @vitest-environment happy-dom
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IncomingRequestResponse } from '@/core/hono/dashboard-api'

import { IncomingRequestTable } from './components/incoming-request-table/incoming-request-table'
import { MainLayout } from './layout/layout'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-context'
import { Dashboard } from './views/dashboard/dashboard'

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

function renderAt(element: React.ReactNode) {
    const router = createMemoryRouter([{ element, path: '/' }])

    return render(
        <QueryProvider>
            <ThemeProvider>
                <RouterProvider router={router} />
            </ThemeProvider>
        </QueryProvider>
    )
}

const request = (id: string): IncomingRequestResponse => ({
    created_at: '2026-11-19T10:00:00.000Z',
    duration: 12,
    id,
    method: 'GET',
    response_status: 200,
    uri: `/items/${id}`,
})

const SLOW = { timeout: 15_000 }

describe('dashboard accessibility', { timeout: 30_000 }, () => {
    it('gives every table row a real link to its detail page', () => {
        renderAt(
            <IncomingRequestTable entries={[request('a'), request('b')]} />
        )

        const rows = screen.getAllByRole('row').slice(1)
        expect(rows).toHaveLength(2)
        expect(within(rows[0]!).getByRole('link').getAttribute('href')).toBe(
            '/incoming-requests/a'
        )
        expect(within(rows[1]!).getByRole('link').getAttribute('href')).toBe(
            '/incoming-requests/b'
        )
    })

    it('pages a long list instead of rendering every entry at once', () => {
        const entries = Array.from({ length: 120 }, (_, index) =>
            request(String(index))
        )

        renderAt(<IncomingRequestTable entries={entries} />)

        expect(screen.getAllByRole('row').length - 1).toBeLessThanOrEqual(50)
    })

    it('makes each stat card a link to its list', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () =>
                Response.json({
                    exceptions: { total: 1 },
                    incomingRequests: { total: 2 },
                    logs: { total: 3 },
                    outgoingRequests: { total: 4 },
                    queries: { total: 5 },
                })
            )
        )

        renderAt(<Dashboard />)

        const link = await screen.findByRole(
            'link',
            { name: /Incoming Requests/ },
            SLOW
        )
        expect(link.getAttribute('href')).toBe('/incoming-requests')
    })

    it('gives every image a text alternative', () => {
        renderAt(<MainLayout />)

        for (const image of document.querySelectorAll('img')) {
            expect(image.hasAttribute('alt')).toBe(true)
        }
        expect(document.querySelectorAll('img').length).toBeGreaterThan(0)
    })

    it('drops the error and shows loading while Retry refetches', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response('nope', { status: 500 }))
            .mockReturnValue(new Promise(() => undefined))
        vi.stubGlobal('fetch', fetchMock)

        renderAt(<Dashboard />)
        fireEvent.click(
            await screen.findByRole('button', { name: 'Retry' }, SLOW)
        )

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
        }, SLOW)
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })
})
