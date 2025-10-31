import type { Context, Next, MiddlewareHandler } from 'hono';
import { Telescope } from '../telescope';
import { TelescopeConfig } from '@/types';
import { ContextManager } from '../context-manager';
import { HttpInterceptor } from '../interceptors/http-interceptor';
import { DatabaseInterceptor } from '../interceptors/database-interceptor';
import { IGNORED_PATHS, IGNORED_STATIC_EXTENSIONS } from '../constants';
import { some } from 'lodash';
import { getExceptionClassCode } from '../utils/helpers';

function isStaticAsset(path: string): boolean {
  return IGNORED_STATIC_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
}

export function telescope(config?: Partial<TelescopeConfig>): MiddlewareHandler {
  const telescopeInstance = Telescope.getInstance(config);
  const contextManager = ContextManager.getInstance();

  const httpInterceptor = HttpInterceptor.getInstance();
  const dbInterceptor = DatabaseInterceptor.getInstance();

  httpInterceptor.startIntercepting();
  dbInterceptor.startIntercepting();

  return async (c: Context, next: Next) => {
    if (some(IGNORED_PATHS, (path) => c.req.path.startsWith(path))) {
      await next();
      return;
    }

    if (isStaticAsset(c.req.path)) {
      await next();
      return;
    }

    const startTime = Date.now();

    const requestData = {
      method: c.req.method,
      uri: c.req.path,
      headers: c.req.header(),
      ip_address: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      user_agent: c.req.header('user-agent') || 'unknown',
    };

    const requestId = crypto.randomUUID();

    const requestContext = {
      requestId: requestId,
      method: requestData.method,
      uri: requestData.uri,
      startTime,
    };

    let requestBody: Record<string, unknown> = {};

    const contentType = c.req.header('content-type');
    if (contentType?.includes('application/json')) {
      try {
        if (contentType?.includes('application/json')) {
          requestBody = await c.req.json();
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const parsed = await c.req.parseBody();
          requestBody = parsed ?? {};
        }
      } catch {
        requestBody = {};
      }
    }

    let responseBody: Record<string, unknown> = {};
    let responseStatus = 200;
    let responseHeaders: Record<string, string> = {};

    let hasError = false;

    return await contextManager.run(requestContext, async () => {
      try {
        await next();

        responseStatus = c.res.status;
        responseHeaders = {};
        c.res.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const response = c.res.clone();
        const text = await response.text();

        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = { response: text };
        }
      } catch (error: unknown) {
        hasError = true;
        responseStatus = 500;
        responseBody = { error: 'Internal Server Error' };

        if (error instanceof Error) {
          try {
            await telescopeInstance.recordException({
              class: getExceptionClassCode(error?.constructor?.name || 'Error'),
              message: error?.message || 'Unknown error',
              trace: error?.stack || '',
              context: {
                method: requestData.method,
                uri: requestData.uri,
              },
              parent_id: requestId,
            });
          } catch {
            // Silently ignore error
          }
        }
      } finally {
        const endTime = Date.now();
        const duration = endTime - startTime;

        await telescopeInstance.recordIncomingRequest(
          {
            method: requestData.method,
            uri: requestData.uri,
            headers: requestData.headers,
            payload: requestBody,
            response_status: responseStatus,
            response_headers: responseHeaders,
            response: responseBody,
            duration,
            ip_address: requestData.ip_address,
            user_agent: requestData.user_agent,
          },
          requestId
        );
      }

      if (hasError) {
        return c.text('Internal Server Error', 500);
      }
    });
  };
}
