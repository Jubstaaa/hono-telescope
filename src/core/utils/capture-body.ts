import type { CaptureConfig } from '../../types/index.js';
import { redactBody } from './redact.js';

const CAPTURABLE = [/^application\/json\b/, /\+json\b/, /^text\//];

export function isCapturableContentType(contentType: string | null): boolean {
  if (!contentType) return false;

  const value = contentType.toLowerCase();
  if (value.startsWith('text/event-stream')) return false;

  return CAPTURABLE.some((pattern) => pattern.test(value));
}

/**
 * Hono's stream helpers set `Transfer-Encoding: chunked`; `streamText` also declares
 * `text/plain`, which would otherwise look capturable. Reading such a body would hold the
 * response until the handler finished streaming.
 */
export function isStreamedResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.startsWith('text/event-stream')) return true;

  const transferEncoding = response.headers.get('transfer-encoding')?.toLowerCase() ?? '';
  return transferEncoding.includes('chunked');
}

export async function readCappedText(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
): Promise<{ text: string; truncated: boolean }> {
  if (!body) return { text: '', truncated: false };

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      const remaining = maxBytes - size;
      if (value.byteLength > remaining) {
        chunks.push(value.subarray(0, remaining));
        size = maxBytes;
        truncated = true;
        break;
      }

      chunks.push(value);
      size += value.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return { text: new TextDecoder().decode(concat(chunks)), truncated };
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
}

export async function captureResponseBody(
  response: Response,
  capture: CaptureConfig,
  redactBodyKeys: string[]
): Promise<Record<string, unknown> | undefined> {
  if (!capture.responseBody) return undefined;
  if (isStreamedResponse(response)) return undefined;

  const contentType = response.headers.get('content-type');
  if (!isCapturableContentType(contentType)) return undefined;

  const declared = Number(response.headers.get('content-length') ?? Number.NaN);
  if (!Number.isNaN(declared) && declared > capture.maxBodySize) {
    return { truncated: true, size: declared };
  }

  const { text, truncated } = await readCappedText(response.clone().body, capture.maxBodySize);
  if (truncated) return { truncated: true, response: text };

  return redactBody(parse(text), redactBodyKeys) as Record<string, unknown>;
}

function parse(text: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : { response: parsed };
  } catch {
    return { response: text };
  }
}
