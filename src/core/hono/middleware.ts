import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import type { ResolvedConfig } from '../../types/index.js';
import type { Recorder } from '../recorder.js';
import { IGNORED_STATIC_EXTENSIONS } from '../constants.js';
import { getExceptionClassCode } from '../utils/helpers.js';
import { redactBody, redactHeaders } from '../utils/redact.js';
import { captureResponseBody, isCapturableContentType } from '../utils/capture-body.js';

function shouldIgnore(path: string, config: ResolvedConfig): boolean {
  if (config.ignorePaths.some((ignored) => path.startsWith(ignored))) return true;

  if (config.ignoreStaticAssets) {
    const lowered = path.toLowerCase();
    return IGNORED_STATIC_EXTENSIONS.some((extension) => lowered.endsWith(extension));
  }

  return false;
}

async function readRequestBody(
  c: Context,
  config: ResolvedConfig
): Promise<Record<string, unknown>> {
  if (!config.capture.requestBody) return {};

  const contentType = c.req.header('content-type') ?? null;
  const isForm = contentType?.includes('x-www-form-urlencoded') ?? false;
  if (!isCapturableContentType(contentType) && !isForm) return {};

  const declared = Number(c.req.header('content-length') ?? Number.NaN);
  if (!Number.isNaN(declared) && declared > config.capture.maxBodySize) {
    return { truncated: true, size: declared };
  }

  try {
    const body = isForm ? await c.req.parseBody() : await readTextBody(c, config);
    return (redactBody(body, config.redact.bodyKeys) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * `c.req.text()` is cached by Hono, so the handler can still read the body afterwards. A
 * chunked request declares no content-length, so the cap has to be applied to what we read.
 */
async function readTextBody(c: Context, config: ResolvedConfig): Promise<unknown> {
  const text = await c.req.text();
  if (text === '') return {};

  const size = Buffer.byteLength(text);
  if (size > config.capture.maxBodySize) return { truncated: true, size };

  if (!(c.req.header('content-type') ?? '').toLowerCase().includes('json')) return { body: text };

  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === 'object' ? parsed : { body: parsed };
  } catch {
    return { body: text };
  }
}

function responseHeadersOf(response: Response, config: ResolvedConfig): Record<string, unknown> {
  const headers: Record<string, unknown> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return redactHeaders(headers, config.redact.headers);
}

function recordException(
  recorder: Recorder,
  error: Error,
  base: { method: string; uri: string },
  requestId: string
): Promise<string> {
  return recorder.record('exception', {
    class: getExceptionClassCode(error.constructor?.name ?? 'Error'),
    message: error.message,
    trace: error.stack ?? '',
    context: { method: base.method, uri: base.uri },
    parent_id: requestId,
  });
}

export function createMiddleware(recorder: Recorder, config: ResolvedConfig): MiddlewareHandler {
  return async (c, next) => {
    if (shouldIgnore(c.req.path, config)) {
      await next();
      return;
    }

    const startTime = Date.now();
    const requestId = randomUUID();
    const headers = redactHeaders(c.req.header(), config.redact.headers);
    const payload = await readRequestBody(c, config);

    const base = {
      method: c.req.method,
      uri: c.req.path,
      headers,
      payload,
      ip_address: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown',
      user_agent: c.req.header('user-agent') ?? 'unknown',
    };

    return config.context.run(
      { requestId, method: c.req.method, uri: c.req.path, startTime },
      async () => {
        try {
          await next();
        } catch (error) {
          // Reached only if an error escapes Hono's own compose/onError handling entirely
          // (e.g. the app's onError handler itself throws). The common case — a handler
          // throwing while `app.onError` is registered — never lands here: Hono's compose
          // always has a default errorHandler, so it catches the error and converts it to a
          // response before it can reject our `next()` call. That case is detected below via
          // `c.error`, which Hono sets for exactly this purpose.
          if (error instanceof Error) {
            await recordException(recorder, error, base, requestId);
          }

          await recorder.record(
            'incoming_request',
            {
              ...base,
              response_status: 500,
              response_headers: {},
              response: {},
              duration: Date.now() - startTime,
            },
            requestId
          );

          throw error;
        }

        if (c.error) {
          await recordException(recorder, c.error, base, requestId);
        }

        const response = c.res;

        let capturedResponse: Record<string, unknown> = {};
        try {
          capturedResponse =
            (await captureResponseBody(response, config.capture, config.redact.bodyKeys)) ?? {};
        } catch {
          capturedResponse = { error: 'response capture failed' };
        }

        await recorder.record(
          'incoming_request',
          {
            ...base,
            response_status: response.status,
            response_headers: responseHeadersOf(response, config),
            response: capturedResponse,
            duration: Date.now() - startTime,
          },
          requestId
        );
      }
    );
  };
}
