import type { Context, MiddlewareHandler } from 'hono'

import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'

import type { ResolvedConfig } from '../config.js'
import type { Recorder } from '../recorder.js'

import {
    captureResponseBody,
    isCapturableContentType,
} from '../capture/capture-body.js'
import { redactBody, redactHeaders } from '../capture/redact.js'
import { getExceptionClassCode } from '../exception-class.js'

const IGNORED_STATIC_EXTENSIONS = [
    '.js',
    '.css',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.ico',
    '.map',
    '.html',
    '.xml',
    '.json',
    '.txt',
    '.md',
    '.csv',
    '.xls',
    '.xlsx',
    '.pdf',
    '.doc',
    '.docx',
] as const

export function createMiddleware(
    recorder: Recorder,
    config: ResolvedConfig
): MiddlewareHandler {
    return async (c, next) => {
        if (shouldIgnore(c.req.path, config)) {
            await next()
            return
        }

        const startTime = Date.now()
        const requestId = randomUUID()
        const headers = redactHeaders(c.req.header(), config.redact.headers)
        const payload = await readRequestBody(c, config)

        const base = {
            headers,
            ip_address:
                c.req.header('x-forwarded-for') ??
                c.req.header('x-real-ip') ??
                'unknown',
            method: c.req.method,
            payload,
            uri: c.req.path,
            user_agent: c.req.header('user-agent') ?? 'unknown',
        }

        return config.context.run(
            { method: c.req.method, requestId, startTime, uri: c.req.path },
            async () => {
                try {
                    await next()
                } catch (error) {
                    if (error instanceof Error) {
                        await recordException(recorder, error, base, requestId)
                    }

                    await recorder.record(
                        'incoming_request',
                        {
                            ...base,
                            duration: Date.now() - startTime,
                            response: {},
                            response_headers: {},
                            response_status: 500,
                        },
                        requestId
                    )

                    throw error
                }

                if (c.error) {
                    await recordException(recorder, c.error, base, requestId)
                }

                const response = c.res

                let capturedResponse: Record<string, unknown>
                try {
                    capturedResponse =
                        (await captureResponseBody(
                            response,
                            config.capture,
                            config.redact.bodyKeys
                        )) ?? {}
                } catch {
                    capturedResponse = { error: 'response capture failed' }
                }

                await recorder.record(
                    'incoming_request',
                    {
                        ...base,
                        duration: Date.now() - startTime,
                        response: capturedResponse,
                        response_headers: responseHeadersOf(response, config),
                        response_status: response.status,
                    },
                    requestId
                )
            }
        )
    }
}

async function readRequestBody(
    c: Context,
    config: ResolvedConfig
): Promise<Record<string, unknown>> {
    if (!config.capture.requestBody) return {}

    const contentType = c.req.header('content-type') ?? null
    const isForm = contentType?.includes('x-www-form-urlencoded') ?? false
    if (!isCapturableContentType(contentType) && !isForm) return {}

    const declared = Number(c.req.header('content-length') ?? Number.NaN)
    if (!Number.isNaN(declared) && declared > config.capture.maxBodySize) {
        return { size: declared, truncated: true }
    }

    try {
        const body = isForm
            ? await c.req.parseBody()
            : await readTextBody(c, config)
        return (redactBody(body, config.redact.bodyKeys) ?? {}) as Record<
            string,
            unknown
        >
    } catch {
        return {}
    }
}

async function readTextBody(
    c: Context,
    config: ResolvedConfig
): Promise<unknown> {
    const text = await c.req.text()
    if (text === '') return {}

    const size = Buffer.byteLength(text)
    if (size > config.capture.maxBodySize) return { size, truncated: true }

    if (!(c.req.header('content-type') ?? '').toLowerCase().includes('json'))
        return { body: text }

    try {
        const parsed: unknown = JSON.parse(text)
        return parsed !== null &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed)
            ? parsed
            : { body: parsed }
    } catch {
        return { body: text }
    }
}

function recordException(
    recorder: Recorder,
    error: Error,
    base: { method: string; uri: string },
    requestId: string
): Promise<string> {
    return recorder.record('exception', {
        class: getExceptionClassCode(error.constructor.name),
        context: { method: base.method, uri: base.uri },
        message: error.message,
        parent_id: requestId,
        trace: error.stack ?? '',
    })
}

function responseHeadersOf(
    response: Response,
    config: ResolvedConfig
): Record<string, unknown> {
    const headers: Record<string, unknown> = {}
    response.headers.forEach((value, key) => {
        headers[key] = value
    })

    return redactHeaders(headers, config.redact.headers)
}

function shouldIgnore(path: string, config: ResolvedConfig): boolean {
    if (config.ignorePaths.some(ignored => path.startsWith(ignored)))
        return true

    if (config.ignoreStaticAssets) {
        const lowered = path.toLowerCase()
        return IGNORED_STATIC_EXTENSIONS.some(extension =>
            lowered.endsWith(extension)
        )
    }

    return false
}
