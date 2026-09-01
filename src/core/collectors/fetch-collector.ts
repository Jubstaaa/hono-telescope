import type { Recorder } from '../recorder.js';
import {
  DEFAULT_MAX_BODY_SIZE,
  DEFAULT_REDACT_BODY_KEYS,
  DEFAULT_REDACT_HEADERS,
} from '../constants.js';
import { redactHeaders } from '../utils/redact.js';
import { captureResponseBody } from '../utils/capture-body.js';
import type { Collector } from './collector.js';

export interface FetchCollectorOptions {
  redactHeaders?: string[];
  redactBodyKeys?: string[];
  maxBodySize?: number;
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function headersOf(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  keys: string[]
): Record<string, unknown> {
  const source =
    init?.headers !== undefined
      ? new Headers(init.headers)
      : input instanceof Request
        ? input.headers
        : new Headers();

  const headers: Record<string, unknown> = {};
  source.forEach((value, key) => {
    headers[key] = value;
  });

  return redactHeaders(headers, keys);
}

function responseHeadersOf(response: Response, keys: string[]): Record<string, unknown> {
  const headers: Record<string, unknown> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return redactHeaders(headers, keys);
}

export function fetchCollector(options: FetchCollectorOptions = {}): Collector {
  const redactKeys = options.redactHeaders ?? [...DEFAULT_REDACT_HEADERS];
  const redactBodyKeys = options.redactBodyKeys ?? [...DEFAULT_REDACT_BODY_KEYS];
  const maxBodySize = options.maxBodySize ?? DEFAULT_MAX_BODY_SIZE;
  let installed = false;
  let uninstall = () => {};

  return {
    name: 'fetch',

    install(recorder: Recorder) {
      if (installed) return uninstall;
      installed = true;

      const original = globalThis.fetch;

      const patched = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const startTime = Date.now();
        const uri = urlOf(input);
        const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

        const requestHeaders = headersOf(input, init, redactKeys);

        try {
          const response = await original(input, init);

          let captured: Record<string, unknown> = {};
          try {
            captured =
              (await captureResponseBody(
                response,
                { requestBody: false, responseBody: true, maxBodySize },
                redactBodyKeys
              )) ?? {};
          } catch {
            captured = { error: 'response capture failed' };
          }

          void recorder
            .record('outgoing_request', {
              method,
              uri,
              headers: requestHeaders,
              payload: {},
              response_status: response.status,
              response_headers: responseHeadersOf(response, redactKeys),
              response: captured,
              duration: Date.now() - startTime,
            })
            .catch(() => undefined);

          return response;
        } catch (error) {
          void recorder
            .record('outgoing_request', {
              method,
              uri,
              headers: requestHeaders,
              payload: {},
              response_status: 0,
              response_headers: {},
              response: { error: error instanceof Error ? error.message : String(error) },
              duration: Date.now() - startTime,
            })
            .catch(() => undefined);

          throw error;
        }
      };

      Object.assign(patched, original);
      globalThis.fetch = patched as typeof fetch;

      uninstall = () => {
        if (!installed) return;
        installed = false;
        globalThis.fetch = original;
      };

      return uninstall;
    },
  };
}
