import type { Context } from 'hono'
import type { HtmlEscapedString } from 'hono/utils/html'

import { Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { csrf } from 'hono/csrf'
import { html as escapedHtml } from 'hono/html'
import { secureHeaders } from 'hono/secure-headers'

import type { ResolvedConfig } from '../config.js'
import type { EntryType } from '../entries.js'
import type { Recorder } from '../recorder.js'

import { mountMcp } from '../mcp/routes.js'
import {
    mapException,
    mapIncomingRequest,
    mapLog,
    mapOutgoingRequest,
    mapQuery,
} from './dashboard-api.js'
import { DASHBOARD_ASSETS, DASHBOARD_HTML } from './dashboard-assets.js'

const RESOURCES: Record<string, EntryType> = {
    'exceptions': 'exception',
    'incoming-requests': 'incoming_request',
    'logs': 'log',
    'outgoing-requests': 'outgoing_request',
    'queries': 'query',
}

const MAPPERS = {
    exception: mapException,
    incoming_request: mapIncomingRequest,
    log: mapLog,
    outgoing_request: mapOutgoingRequest,
    query: mapQuery,
} as const

function renderHtml(basePath: string): string {
    const meta = sync(
        escapedHtml`<meta name="telescope-base" content="${basePath}">`
    )
    const base = sync(escapedHtml`${basePath}`)
    const withBase = DASHBOARD_HTML.replace(
        /(src|href)=["']\.?\/?assets\//g,
        `$1="${base}/assets/`
    )

    return withBase.includes('</head>')
        ? withBase.replace('</head>', `${meta}</head>`)
        : `${meta}${withBase}`
}

function sync(value: HtmlEscapedString | Promise<HtmlEscapedString>): string {
    if (value instanceof Promise) {
        throw new TypeError('html() went async for a plain string value')
    }

    return value.toString()
}

const SECURITY_HEADERS = secureHeaders({
    contentSecurityPolicy: {
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        defaultSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
    },
    strictTransportSecurity: false,
})

export function createDashboard(
    recorder: Recorder,
    config: ResolvedConfig
): Hono {
    if (
        config.enabled &&
        process.env.NODE_ENV === 'production' &&
        config.dashboard.auth === undefined
    ) {
        throw new Error(
            'hono-telescope: refusing to expose the dashboard in production without credentials. ' +
                'Set `enabled: false`, or provide `dashboard.auth: { username, password }`.'
        )
    }

    const app = new Hono()
    const html = renderHtml(config.dashboardPath)

    app.use('*', SECURITY_HEADERS)

    if (config.dashboard.auth) {
        app.use('*', basicAuth(config.dashboard.auth))
    }

    app.use('/api/*', csrf({ origin: sameHost }))

    app.get('/assets/:file', c => {
        const asset = DASHBOARD_ASSETS[c.req.param('file')]
        if (!asset) return c.json({ error: 'Not found' }, 404)

        c.header('Content-Type', asset.contentType)

        c.header('Cache-Control', 'max-age=31536000, immutable')
        return c.body(asset.body)
    })

    app.get('/api/stats', async c => {
        const [incomingRequests, outgoingRequests, exceptions, queries, logs] =
            await Promise.all([
                recorder.count('incoming_request'),
                recorder.count('outgoing_request'),
                recorder.count('exception'),
                recorder.count('query'),
                recorder.count('log'),
            ])

        return c.json({
            exceptions: { total: exceptions },
            incomingRequests: { total: incomingRequests },
            logs: { total: logs },
            outgoingRequests: { total: outgoingRequests },
            queries: { total: queries },
        })
    })

    app.post('/api/clear', async c => {
        await recorder.clear()
        return c.json({
            message: 'All data cleared successfully',
            success: true,
        })
    })

    app.get('/api/:resource', async c => {
        const type = RESOURCES[c.req.param('resource')]
        if (!type) return c.json({ error: 'Not found' }, 404)

        const entries = await recorder.list(type)
        const map = MAPPERS[type] as (entry: unknown) => unknown

        return c.json(entries.map(map))
    })

    app.get('/api/:resource/:id', async c => {
        const type = RESOURCES[c.req.param('resource')]
        if (!type) return c.json({ error: 'Not found' }, 404)

        const entry = await recorder.find(type, c.req.param('id'))
        if (!entry) return c.json({ error: 'Not found' }, 404)

        if (type !== 'incoming_request') return c.json(entry)

        const [logs, queries, exceptions, outgoingRequests] = await Promise.all(
            [
                recorder.findByParent('log', entry.id),
                recorder.findByParent('query', entry.id),
                recorder.findByParent('exception', entry.id),
                recorder.findByParent('outgoing_request', entry.id),
            ]
        )

        return c.json({
            ...entry,
            relation_entries: {
                exceptions: exceptions.map(mapException),
                logs: logs.map(mapLog),
                outgoing_requests: outgoingRequests.map(mapOutgoingRequest),
                queries: queries.map(mapQuery),
            },
        })
    })

    mountMcp(app, recorder)

    app.get('/*', c => {
        c.header('Cache-Control', 'no-transform')
        return c.html(html)
    })

    return app
}

function sameHost(origin: string, c: Context): boolean {
    if (!URL.canParse(origin)) return false

    return new URL(origin).host === new URL(c.req.url).host
}
