import { Telescope } from '../telescope';
import { ContextManager } from '../context-manager';
import { forEach } from 'lodash';

export class HttpInterceptor {
  private static instance: HttpInterceptor;
  private telescope: Telescope;
  private contextManager: ContextManager;
  private originalFetch: typeof fetch;
  private isIntercepting = false;
  private axiosIntercepted = false;

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
    
    globalThis.fetch = this.createInterceptedFetch();
    
    this.setupAxiosInterceptors();
  }

  public stopIntercepting(): void {
    if (!this.isIntercepting) return;

    this.isIntercepting = false;
    globalThis.fetch = this.originalFetch;
    
    this.removeAxiosInterceptors();
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
        response = await originalFetch(input, init);
        
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
        response = new Response(null, { 
          status: 0, 
          statusText: 'Network Error' 
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const requestId = contextManager.getCurrentRequestId();
      
      await telescope.recordOutgoingRequest({
        method: method || 'GET',
        uri: url,
        headers: sanitizeHeaders(headers),
        payload: requestBody,
        response_status: response.status,
        response_headers: sanitizeHeaders(responseHeaders),
        response: responseBody,
        duration,
        parent_id: requestId || 'unknown'
      });

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
      forEach(headers, (value, key) => {
        sanitized[key.toLowerCase()] = String(value);
      });
    }

    return sanitized;
  }

  private setupAxiosInterceptors(): void {
      let axios: any = null;
      
      if (typeof globalThis !== 'undefined' && (globalThis as any).axios) {
        axios = (globalThis as any).axios;
      } else if (typeof window !== 'undefined' && (window as any).axios) {
        axios = (window as any).axios;
      } else {
        try {
          axios = require('axios');
        } catch {
          try {
            const axiosModule = eval('require("axios")');
            axios = axiosModule.default || axiosModule;
          } catch {
            return;
          }
        }
      }

      if (!axios) {
        return;
      }
      
      if (this.axiosIntercepted) {
        return;
      }

      axios.interceptors.request.use(
        (config: any) => {
          config._telescopeStartTime = Date.now();
          return config;
        },
        (error: any) => Promise.reject(error)
      );

      axios.interceptors.response.use(
        async (response: any) => {
          await this.recordAxiosRequest(response.config, response, null);
          return response;
        },
        async (error: any) => {
          if (error.config) {
            await this.recordAxiosRequest(error.config, error.response, error);
          }
          return Promise.reject(error);
        }
      );

      this.axiosIntercepted = true;
  }

  private removeAxiosInterceptors(): void {
      let axios: any = null;
      
      if (typeof globalThis !== 'undefined' && (globalThis as any).axios) {
        axios = (globalThis as any).axios;
      } else {
        try {
          axios = require('axios');
        } catch {
          return;
        }
      }

      if (axios && this.axiosIntercepted) {
        axios.interceptors.request.clear();
        axios.interceptors.response.clear();
        this.axiosIntercepted = false;
      }
  }

  private async recordAxiosRequest(config: any, response: any, error: any): Promise<void> {
    try {
      const endTime = Date.now();
      const startTime = config._telescopeStartTime || endTime;
      const duration = endTime - startTime;

      const url = config.url || '';
      const method = (config.method || 'GET').toUpperCase();
      
      let requestBody: any = null;
      if (config.data) {
        try {
          requestBody = typeof config.data === 'string' ? 
            (config.data.length > 1000 ? config.data.substring(0, 1000) + '...' : config.data) :
            config.data;
        } catch {
          requestBody = '[Unable to serialize request data]';
        }
      }

      let responseBody: any = null;
      let responseStatus = 0;
      let responseHeaders: Record<string, string> = {};

      if (response) {
        responseStatus = response.status || 0;
        responseHeaders = this.sanitizeHeaders(response.headers || {});
        
        try {
          responseBody = response.data;
          if (typeof responseBody === 'string' && responseBody.length > 1000) {
            responseBody = responseBody.substring(0, 1000) + '...';
          }
        } catch {
          responseBody = '[Unable to capture response]';
        }
      } else if (error) {
        responseStatus = error.response?.status || 0;
        responseHeaders = this.sanitizeHeaders(error.response?.headers || {});
        responseBody = error.message || 'Request failed';
      }

      const requestId = this.contextManager.getCurrentRequestId();
      
      await this.telescope.recordOutgoingRequest({
        method,
        uri: url,
        headers: this.sanitizeHeaders(config.headers || {}),
        payload: requestBody,
        response_status: responseStatus,
        response_headers: responseHeaders,
        response: responseBody,
        duration,
        parent_id: requestId || 'unknown'
      });
    } catch (recordError) {
      console.warn('Failed to record axios request:', recordError);
    }
  }
}