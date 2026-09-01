import type { Recorder } from '../recorder';
import { DEFAULT_REDACT_HEADERS } from '../constants';
import { redactHeaders } from '../utils/redact';
import { captureResponseBody } from '../utils/capture-body';
import type { Collector } from './collector';

export interface FetchCollectorOptions {
  redactHeaders?: string[];
  maxBodySize?: number;
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function headersOf(init: RequestInit | undefined, keys: string[]): Record<string, unknown> {
  const headers: Record<string, unknown> = {};
  new Headers(init?.headers ?? {}).forEach((value, key) => {
    headers[key] = value;
  });

  return redactHeaders(headers, keys);
}

export function fetchCollector(options: FetchCollectorOptions = {}): Collector {
  const redactKeys = options.redactHeaders ?? [...DEFAULT_REDACT_HEADERS];
  const maxBodySize = options.maxBodySize ?? 65536;
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

        try {
          const response = await original(input, init);

          void recorder
            .record('outgoing_request', {
              method,
              uri,
              headers: headersOf(init, redactKeys),
              payload: {},
              response_status: response.status,
              response_headers: {},
              response:
                (await captureResponseBody(response, {
                  requestBody: false,
                  responseBody: true,
                  maxBodySize,
                })) ?? {},
              duration: Date.now() - startTime,
            })
            .catch(() => undefined);

          return response;
        } catch (error) {
          void recorder
            .record('outgoing_request', {
              method,
              uri,
              headers: headersOf(init, redactKeys),
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
