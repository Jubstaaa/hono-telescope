import { Telescope } from '../telescope';
import { EntryType } from '../types';
import { formatDuration, getMemoryUsage } from '../utils';
import { ContextManager } from '../context-manager';

export class HttpInterceptor {
  private static instance: HttpInterceptor;
  private telescope: Telescope;
  private contextManager: ContextManager;
  private originalFetch: typeof fetch;
  private isIntercepting = false;

  private constructor() {
    this.telescope = Telescope.getInstance();
    this.contextManager = ContextManager.getInstance();
    this.originalFetch = globalThis.fetch;
  }

  public static getInstance(): HttpInterceptor {
    if (!HttpInterceptor.instance) {
      HttpInterceptor.instance = new HttpInterceptor();
    }
    return HttpInterceptor.instance;
  }

  public startIntercepting(): void {
    if (this.isIntercepting) return;

    this.isIntercepting = true;
    
    // Override global fetch
    globalThis.fetch = this.createInterceptedFetch();
  }

  public stopIntercepting(): void {
    if (!this.isIntercepting) return;

    this.isIntercepting = false;
    globalThis.fetch = this.originalFetch;
  }

  private createInterceptedFetch() {
    const originalFetch = this.originalFetch;
    const telescope = this.telescope;
    const contextManager = this.contextManager;
    const sanitizeHeaders = this.sanitizeHeaders.bind(this);

    return async function interceptedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const startTime = Date.now();
      const startMemory = getMemoryUsage();

      // Extract request details
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';
      const headers = init?.headers || {};
      
      let requestBody: any = null;
      if (init?.body) {
        try {
          if (typeof init.body === 'string') {
            try {
              requestBody = JSON.parse(init.body);
            } catch {
              requestBody = init.body;
            }
          } else {
            requestBody = init.body.toString();
          }
        } catch {
          requestBody = '[Binary Data]';
        }
      }

      let response: Response;
      let responseBody: any = null;
      let error: Error | null = null;

      try {
        // Make the actual request
        response = await originalFetch(input, init);
        
        // Try to capture response body
        try {
          const responseClone = response.clone();
          const text = await responseClone.text();
          
          if (text) {
            try {
              responseBody = JSON.parse(text);
            } catch {
              responseBody = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
            }
          }
        } catch {
          responseBody = '[Unable to capture response]';
        }

      } catch (err: any) {
        error = err;
        // Create a mock response for failed requests
        response = new Response(null, { 
          status: 0, 
          statusText: 'Network Error' 
        });
      }

      // Calculate metrics
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endMemory = getMemoryUsage();
      const memoryUsed = endMemory - startMemory;

      // Convert response headers to object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Record the outgoing HTTP request
      const requestId = contextManager.getCurrentRequestId();
      
      await telescope.record(EntryType.OUTGOING_REQUEST, {
        method,
        uri: url,
        headers: sanitizeHeaders(headers),
        payload: requestBody,
        response_status: response.status,
        response_headers: sanitizeHeaders(responseHeaders),
        response: responseBody,
        duration,
        memory: memoryUsed,
        ip_address: 'outgoing',
        user_agent: 'hono-telescope-interceptor'
      }, [
        `outgoing:true`,
        `status:${response.status}`,
        `method:${method}`,
        `duration:${formatDuration(duration)}`,
        ...(error ? ['error:true'] : [])
      ], undefined, requestId);

      if (error) {
        throw error;
      }

      return response;
    };
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        sanitized[key.toLowerCase()] = value;
      });
    } else if (typeof headers === 'object' && headers !== null) {
      Object.entries(headers).forEach(([key, value]) => {
        sanitized[key.toLowerCase()] = String(value);
      });
    }

    return sanitized;
  }
}