import type { Context, Next, MiddlewareHandler } from 'hono';
import { Telescope } from '../telescope';
import { EntryType, IncomingRequestEntry, TelescopeConfig } from '../types';
import { formatDuration, getMemoryUsage, sanitizeHeaders } from '../utils';
import { ContextManager } from '../context-manager';
import { HttpInterceptor } from '../interceptors/http-interceptor';
import { DatabaseInterceptor } from '../interceptors/database-interceptor';

export function telescope(config?: Partial<TelescopeConfig>): MiddlewareHandler {
  const telescopeInstance = Telescope.getInstance(config);
  const contextManager = ContextManager.getInstance();
  
  // Start interceptors automatically for zero-config experience
  const httpInterceptor = HttpInterceptor.getInstance();
  const dbInterceptor = DatabaseInterceptor.getInstance();
  
  httpInterceptor.startIntercepting();
  dbInterceptor.startIntercepting();

  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const startMemory = getMemoryUsage();
    
    // Skip if path should be ignored
    if (telescopeInstance.shouldIgnore(c.req.path)) {
      await next();
      return;
    }

    // Capture request data
    const requestData = {
      method: c.req.method,
      uri: c.req.url,
      headers: sanitizeHeaders(c.req.header()),
      ip_address: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      user_agent: c.req.header('user-agent') || 'unknown'
    };

    // Generate request ID early for child entries
    const { generateId } = require('../utils');
    const requestId = generateId();
    
    // Set request context for child entries
    const requestContext = {
      requestId: requestId,
      method: requestData.method,
      uri: requestData.uri,
      startTime
    };

    let requestBody: any = null;
    try {
      // Try to capture request body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
        const contentType = c.req.header('content-type');
        if (contentType?.includes('application/json')) {
          requestBody = await c.req.json().catch(() => null);
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          requestBody = await c.req.parseBody().catch(() => null);
        }
      }
    } catch (error) {
      // Ignore body parsing errors
    }

    let responseBody: any = null;
    let responseStatus = 200;
    let responseHeaders: Record<string, string> = {};

    let hasError = false;
    let errorDetails: any = null;

    // Run the request processing within the context
    return await contextManager.run(requestContext, async () => {
      try {
        console.log('Before calling next()'); // Debug log
        await next();
        console.log('After calling next() - no error'); // Debug log
        
        // Capture response data
        responseStatus = c.res.status;
        responseHeaders = {};
        c.res.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        
        // Try to capture response body
        try {
          const response = c.res.clone();
          const text = await response.text();
          
          // Try to parse as JSON, otherwise keep as text
          try {
            responseBody = JSON.parse(text);
          } catch {
            responseBody = text;
          }
        } catch (error) {
          // Ignore response body capture errors
        }
      } catch (error: any) {
        console.log('Caught error in middleware:', error?.message); // Debug log
        // Handle errors during request processing
        hasError = true;
        errorDetails = error;
        responseStatus = 500;
        responseBody = { error: 'Internal Server Error' };
        
        // Record the exception immediately
        try {
          console.log('Recording exception:', error?.message); // Debug log
          await telescopeInstance.record(EntryType.EXCEPTION, {
            class: error?.constructor?.name || 'Error',
            file: 'unknown',
            line: 0,
            message: error?.message || 'Unknown error',
            trace: error?.stack?.split('\n') || [],
            context: {
              method: requestData.method,
              uri: requestData.uri,
              headers: requestData.headers
            }
          });
          console.log('Exception recorded successfully'); // Debug log
        } catch (recordError) {
          console.error('Failed to record exception:', recordError);
        }
      } finally {
        // Calculate metrics
        const endTime = Date.now();
        const duration = endTime - startTime;
        const endMemory = getMemoryUsage();
        const memoryUsed = endMemory - startMemory;

        // Create request entry
        const requestEntry: IncomingRequestEntry = {
          ...requestData,
          payload: requestBody,
          response_status: responseStatus,
          response_headers: sanitizeHeaders(responseHeaders),
          response: responseBody,
          duration,
          memory: memoryUsed
        };

        // Record the incoming request with the pre-generated ID
        await telescopeInstance.record(EntryType.INCOMING_REQUEST, requestEntry, [
          `status:${responseStatus}`,
          `method:${requestData.method}`,
          `duration:${formatDuration(duration)}`
        ], undefined, undefined, requestId);

        // Request context already has the correct requestId
        
        // If there was an error, return error response
        if (hasError) {
          return c.text('Internal Server Error', 500);
        }
      }
    });
  };
}