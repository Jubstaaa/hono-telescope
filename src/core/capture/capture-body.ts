import { Buffer } from 'node:buffer'

import type { CaptureConfig } from '../config.js'

import { redactBody } from './redact.js'

const CAPTURABLE = [/^application\/json\b/, /\+json\b/, /^text\//]

export function captureOutgoingPayload(
    body: BodyInit | null | undefined,
    contentType: null | string,
    maxBodySize: number,
    redactBodyKeys: string[]
): Record<string, unknown> {
    if (body === null || body === undefined) return {}

    if (body instanceof URLSearchParams) {
        return redactBody(Object.fromEntries(body), redactBodyKeys) as Record<
            string,
            unknown
        >
    }

    const text = materialisedText(body)
    if (text === undefined) return {}
    if (contentType !== null && !isCapturableContentType(contentType)) return {}

    const size = Buffer.byteLength(text)
    if (size > maxBodySize) return { size, truncated: true }

    const isJson = (contentType ?? '').toLowerCase().includes('json')
    if (!isJson)
        return redactBody({ body: text }, redactBodyKeys) as Record<
            string,
            unknown
        >

    try {
        const parsed: unknown = JSON.parse(text)
        const wrapped =
            parsed !== null &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed)
                ? parsed
                : { body: parsed }

        return redactBody(wrapped, redactBodyKeys) as Record<string, unknown>
    } catch {
        return redactBody({ body: text }, redactBodyKeys) as Record<
            string,
            unknown
        >
    }
}

export async function captureResponseBody(
    response: Response,
    capture: CaptureConfig,
    redactBodyKeys: string[]
): Promise<Record<string, unknown> | undefined> {
    if (!capture.responseBody) return undefined
    if (isStreamedResponse(response)) return undefined

    const contentType = response.headers.get('content-type')
    if (!isCapturableContentType(contentType)) return undefined

    const declared = Number(
        response.headers.get('content-length') ?? Number.NaN
    )
    if (!Number.isNaN(declared) && declared > capture.maxBodySize) {
        return { size: declared, truncated: true }
    }

    const { text, truncated } = await readCappedText(
        response.clone().body,
        capture.maxBodySize
    )
    if (truncated) return { size: Buffer.byteLength(text), truncated: true }

    return redactBody(parse(text), redactBodyKeys) as Record<string, unknown>
}

export function isCapturableContentType(contentType: null | string): boolean {
    if (!contentType) return false

    const value = contentType.toLowerCase()
    if (value.startsWith('text/event-stream')) return false

    return CAPTURABLE.some(pattern => pattern.test(value))
}

export async function readCappedText(
    body: null | ReadableStream<Uint8Array>,
    maxBytes: number
): Promise<{ text: string; truncated: boolean }> {
    if (!body) return { text: '', truncated: false }

    const reader = body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    let truncated = false

    try {
        for (;;) {
            const { done, value } = await reader.read()
            if (done) break

            const remaining = maxBytes - size
            if (value.byteLength > remaining) {
                chunks.push(value.subarray(0, remaining))
                size = maxBytes
                truncated = true
                break
            }

            chunks.push(value)
            size += value.byteLength
        }
    } finally {
        void reader.cancel().catch(() => undefined)
    }

    return { text: new TextDecoder().decode(concat(chunks)), truncated }
}

function concat(chunks: Uint8Array[]): Uint8Array {
    const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
    const result = new Uint8Array(total)
    let offset = 0

    for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.byteLength
    }

    return result
}

function isStreamedResponse(response: Response): boolean {
    const contentType =
        response.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.startsWith('text/event-stream')) return true

    const transferEncoding =
        response.headers.get('transfer-encoding')?.toLowerCase() ?? ''
    return transferEncoding.includes('chunked')
}

function materialisedText(body: BodyInit): string | undefined {
    if (typeof body === 'string') return body
    if (body instanceof ArrayBuffer) return new TextDecoder().decode(body)
    if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body.buffer)

    return undefined
}

function parse(text: string): Record<string, unknown> {
    try {
        const parsed: unknown = JSON.parse(text)
        return parsed !== null &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : { response: parsed }
    } catch {
        return { response: text }
    }
}
