 import type { Context, Next, MiddlewareHandler } from 'hono';
import { Telescope } from '../telescope';
import { TelescopeConfig } from '@hono-telescope/types';
import { ContextManager } from '../context-manager';
import { HttpInterceptor } from '../interceptors/http-interceptor';
import { DatabaseInterceptor } from '../interceptors/database-interceptor';
import { IGNORED_PATHS } from '../constants';
import { some, forEach } from 'lodash';

export function telescope(config?: Partial<TelescopeConfig>): MiddlewareHandler {
  const telescopeInstance = Telescope.getInstance(config);
  const contextManager = ContextManager.getInstance();
  
  const httpInterceptor = HttpInterceptor.getInstance();
  const dbInterceptor = DatabaseInterceptor.getInstance();
  
  httpInterceptor.startIntercepting();
  dbInterceptor.startIntercepting();

  return async (c: Context, next: Next) => {
    if (some(IGNORED_PATHS, path => c.req.path.startsWith(path))) {
      await next();
      return;
    }

    const startTime = Date.now();

    const requestData = {
      method: c.req.method,
      uri: c.req.url,
      headers: c.req.header(),
      ip_address: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      user_agent: c.req.header('user-agent') || 'unknown'
    };

    const requestId = crypto.randomUUID();
    
    const requestContext = {
      requestId: requestId,
      method: requestData.method,
      uri: requestData.uri,
      startTime
    };

    let requestBody: any = null;

        const contentType = c.req.header('content-type');
        if (contentType?.includes('application/json')) {
          requestBody = await c.req.json().catch(() => null);
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          requestBody = await c.req.parseBody().catch(() => null);
        }

    let responseBody: any = null;
    let responseStatus = 200;
    let responseHeaders: Record<string, string> = {};

    let hasError = false;
    let errorDetails: any = null;

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
            responseBody = text;
          }
       
      } catch (error: any) {
        hasError = true;
        errorDetails = error;
        responseStatus = 500;
        responseBody = { error: 'Internal Server Error' };
        
        try {
          await telescopeInstance.recordException({
            class: error?.constructor?.name || 'Error',
            message: error?.message || 'Unknown error',
            trace: error?.stack?.split('\n') || [],
            context: {
              method: requestData.method,
              uri: requestData.uri
            },
            parent_id: requestId
          });
        } catch (recordError: any) {
        }
      } finally {
        const endTime = Date.now();
        const duration = endTime - startTime;

         await telescopeInstance.recordIncomingRequest({
          method: requestData.method,
          uri: requestData.uri,
          headers: requestData.headers,
          payload: requestBody,
          response_status: responseStatus,
          response_headers: responseHeaders,
          response: responseBody,
          duration,
          ip_address: requestData.ip_address,
          user_agent: requestData.user_agent
        }, requestId);

        if (hasError) {
          return c.text('Internal Server Error', 500);
        }
      }
    });
  };
}