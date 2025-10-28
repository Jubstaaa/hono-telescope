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
    
    // Override global fetch
    globalThis.fetch = this.createInterceptedFetch();
    
    // Setup axios interceptors if axios is available
    this.setupAxiosInterceptors();
  }

  public stopIntercepting(): void {
    if (!this.isIntercepting) return;

    this.isIntercepting = false;
    globalThis.fetch = this.originalFetch;
    
    // Remove axios interceptors
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

  private setupAxiosInterceptors(): void {
    try {
      // Try to get axios from global scope or require
      let axios: any = null;
      
      console.log('🔍 Trying to setup Axios interceptors...');
      
      // Check multiple ways to get axios
      if (typeof globalThis !== 'undefined' && (globalThis as any).axios) {
        axios = (globalThis as any).axios;
        console.log('✅ Found axios in globalThis');
      } else if (typeof window !== 'undefined' && (window as any).axios) {
        axios = (window as any).axios;
        console.log('✅ Found axios in window');
      } else {
        // Try to require axios (for Node.js environments)
        try {
          axios = require('axios');
          console.log('✅ Found axios via require');
        } catch {
          // Try dynamic import
          try {
            const axiosModule = eval('require("axios")');
            axios = axiosModule.default || axiosModule;
            console.log('✅ Found axios via dynamic require');
          } catch {
            console.log('❌ Axios not found, skipping interceptor setup');
            return;
          }
        }
      }

      if (!axios) {
        console.log('❌ Axios is null, skipping');
        return;
      }
      
      if (this.axiosIntercepted) {
        console.log('⚠️ Axios already intercepted, skipping');
        return;
      }

      const telescope = this.telescope;
      const contextManager = this.contextManager;
      const sanitizeHeaders = this.sanitizeHeaders.bind(this);

      // Request interceptor
      console.log('🔧 Setting up axios request interceptor...');
      axios.interceptors.request.use(
        (config: any) => {
          console.log('📤 Axios request intercepted:', config.method?.toUpperCase(), config.url);
          config._telescopeStartTime = Date.now();
          config._telescopeStartMemory = getMemoryUsage();
          return config;
        },
        (error: any) => Promise.reject(error)
      );

      // Response interceptor
      console.log('🔧 Setting up axios response interceptor...');
      axios.interceptors.response.use(
        async (response: any) => {
          console.log('📥 Axios response intercepted:', response.status, response.config?.url);
          await this.recordAxiosRequest(response.config, response, null);
          return response;
        },
        async (error: any) => {
          console.log('❌ Axios error intercepted:', error.message, error.config?.url);
          if (error.config) {
            await this.recordAxiosRequest(error.config, error.response, error);
          }
          return Promise.reject(error);
        }
      );

      this.axiosIntercepted = true;
      console.log('✅ Axios interceptors setup complete!');
    } catch (error) {
      // Silently fail if axios setup fails
      console.warn('❌ Failed to setup axios interceptors:', error);
    }
  }

  private removeAxiosInterceptors(): void {
    try {
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
        // Clear all interceptors (this is a simple approach)
        axios.interceptors.request.clear();
        axios.interceptors.response.clear();
        this.axiosIntercepted = false;
      }
    } catch (error) {
      // Silently fail
    }
  }

  private async recordAxiosRequest(config: any, response: any, error: any): Promise<void> {
    try {
      const endTime = Date.now();
      const startTime = config._telescopeStartTime || endTime;
      const startMemory = config._telescopeStartMemory || 0;
      const duration = endTime - startTime;
      const endMemory = getMemoryUsage();
      const memoryUsed = endMemory - startMemory;

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
      
      await this.telescope.record(EntryType.OUTGOING_REQUEST, {
        method,
        uri: url,
        headers: this.sanitizeHeaders(config.headers || {}),
        payload: requestBody,
        response_status: responseStatus,
        response_headers: responseHeaders,
        response: responseBody,
        duration,
        memory: memoryUsed,
        ip_address: 'outgoing',
        user_agent: 'axios-via-hono-telescope'
      }, [
        `outgoing:true`,
        `status:${responseStatus}`,
        `method:${method}`,
        `duration:${formatDuration(duration)}`,
        `client:axios`,
        ...(error ? ['error:true'] : [])
      ], undefined, requestId);
    } catch (recordError) {
      // Silently fail to avoid breaking the application
      console.warn('Failed to record axios request:', recordError);
    }
  }
}