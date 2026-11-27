import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'

import { RPC_ERRORS, rpcError } from '../core/mcp/protocol.js'

export interface PostResult {
    body: string
    status: number
}

export interface StdioBridgeIo {
    input: AsyncIterable<string | Uint8Array>
    post: (body: string) => Promise<PostResult>
    writeLine: (line: string) => void
}

const SNIPPET_LIMIT = 200

const WRONG_URL_HINT =
    ' Is --url pointing at the dashboard instead of its /mcp endpoint?'

const looksLikeHtml = (body: string) => body.trimStart().startsWith('<')

function describeBody(body: string): string {
    if (looksLikeHtml(body)) return 'an HTML page'

    return body.length > SNIPPET_LIMIT
        ? `${body.slice(0, SNIPPET_LIMIT)}...`
        : body
}

const wrongUrlHint = (body: string, status?: number) =>
    status === 404 || looksLikeHtml(body) ? WRONG_URL_HINT : ''

const reason = (error: unknown) =>
    error instanceof Error ? error.message : String(error)

export async function runStdioBridge(io: StdioBridgeIo): Promise<void> {
    const inFlight = new Set<Promise<void>>()
    const lines = createInterface({
        crlfDelay: Infinity,
        input: Readable.from(io.input),
    })

    for await (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.length === 0) continue

        const task = relay(io, trimmed)
        inFlight.add(task)
        void task.finally(() => inFlight.delete(task))
    }

    await Promise.all([...inFlight])
}

function fail(io: StdioBridgeIo, line: string, message: string): void {
    console.error(`hono-telescope mcp-stdio: ${message}`)

    const id = requestId(line)
    if (id === null) return

    io.writeLine(JSON.stringify(rpcError(id, RPC_ERRORS.internal, message)))
}

async function relay(io: StdioBridgeIo, line: string): Promise<void> {
    let result: PostResult
    try {
        result = await io.post(line)
    } catch (error) {
        fail(
            io,
            line,
            `could not reach the telescope endpoint: ${reason(error)}`
        )

        return
    }

    if (result.status < 200 || result.status >= 300) {
        fail(
            io,
            line,
            `the telescope endpoint answered ${result.status}: ${describeBody(result.body)}.` +
                wrongUrlHint(result.body, result.status)
        )

        return
    }

    const body = result.body.trim()
    if (body.length === 0) return

    let parsed: unknown
    try {
        parsed = JSON.parse(body)
    } catch {
        fail(
            io,
            line,
            `the telescope endpoint answered with a non-JSON body: ${describeBody(body)}.` +
                wrongUrlHint(body)
        )

        return
    }

    io.writeLine(JSON.stringify(parsed))
}

function requestId(line: string): null | number | string {
    try {
        const parsed: unknown = JSON.parse(line)
        if (typeof parsed !== 'object' || parsed === null) return null

        const { id } = parsed as Record<string, unknown>

        return typeof id === 'string' || typeof id === 'number' ? id : null
    } catch {
        return null
    }
}
