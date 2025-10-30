import { Telescope } from '../telescope';
import { ContextManager } from '../context-manager';
import { forEach, isObject, isString } from 'lodash';

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

    const interceptedFetch = this.createInterceptedFetch();
    Object.assign(interceptedFetch, this.originalFetch);
    globalThis.fetch = interceptedFetch as typeof fetch;

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

      const url = isString(input) ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';
      const headers = init?.headers || {};

      let requestBody: Record<string, unknown> = {};
      if (init?.body) {
        try {
          if (isString(init.body)) {
            try {
              requestBody = JSON.parse(init.body);
            } catch {
              requestBody = { body: init.body };
            }
          } else {
            requestBody = { body: init.body.toString() };
          }
        } catch {
          requestBody = { body: '[Binary Data]' };
        }
      }

      let response: Response;
      let responseBody: Record<string, unknown> = {};
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
              responseBody = {
                response: text.length > 1000 ? text.substring(0, 1000) + '...' : text,
              };
            }
          }
        } catch {
          responseBody = { response: '[Unable to capture response]' };
        }
      } catch (err: unknown) {
        error = err instanceof Error ? err : new Error(String(err));
        response = new Response(null, {
          status: 0,
          statusText: 'Network Error',
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
        parent_id: requestId || 'unknown',
      });

      if (error) {
        throw error;
      }

      return response;
    };
  }

  private sanitizeHeaders(headers: unknown): Record<string, string> {
    const sanitized: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        sanitized[key.toLowerCase()] = value;
      });
    } else if (isObject(headers)) {
      forEach(headers, (value, key) => {
        sanitized[key.toLowerCase()] = String(value);
      });
    }

    return sanitized;
  }

  private setupAxiosInterceptors(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let axios: any = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof globalThis !== 'undefined' && (globalThis as any).axios) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      axios = (globalThis as any).axios;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if (typeof window !== 'undefined' && (window as any).axios) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      axios = (window as any).axios;
    } else {
      try {
        const axiosModule = eval('require("axios")');
        axios = axiosModule.default || axiosModule;
      } catch {
        return;
      }
    }

    if (!axios) {
      return;
    }

    if (this.axiosIntercepted) {
      return;
    }

    axios.interceptors.request.use(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config: any) => {
        config._telescopeStartTime = Date.now();
        return config;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (response: any) => {
        await this.recordAxiosRequest(response.config, response, null);
        return response;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let axios: any = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof globalThis !== 'undefined' && (globalThis as any).axios) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      axios = (globalThis as any).axios;
    } else {
      try {
        const axiosModule = eval('require("axios")');
        axios = axiosModule.default || axiosModule;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async recordAxiosRequest(config: any, response: any, error: any): Promise<void> {
    try {
      const endTime = Date.now();
      const startTime = config._telescopeStartTime || endTime;
      const duration = endTime - startTime;

      const url = config.url || '';
      const method = (config.method || 'GET').toUpperCase();

      let requestBody: Record<string, unknown> = {};
      if (config.data) {
        try {
          if (isString(config.data)) {
            try {
              requestBody = JSON.parse(config.data);
            } catch {
              requestBody =
                config.data.length > 1000 ? config.data.substring(0, 1000) + '...' : config.data;
            }
          } else {
            requestBody = config.data;
          }
        } catch {
          requestBody = { body: '[Unable to serialize request data]' };
        }
      }

      let responseBody: Record<string, unknown> = {};
      let responseStatus = 0;
      let responseHeaders: Record<string, string> = {};

      if (response) {
        responseStatus = response.status || 0;
        responseHeaders = this.sanitizeHeaders(response.headers || {});

        try {
          const rawBody = response.data;
          if (isString(rawBody)) {
            responseBody =
              rawBody.length > 1000
                ? { response: rawBody.substring(0, 1000) + '...' }
                : { response: rawBody };
          } else if (isObject(rawBody)) {
            responseBody = rawBody as Record<string, unknown>;
          } else {
            responseBody = { response: String(rawBody) };
          }
        } catch {
          responseBody = { response: '[Unable to capture response]' };
        }
      } else if (error) {
        responseStatus = error.response?.status || 0;
        responseHeaders = this.sanitizeHeaders(error.response?.headers || {});
        responseBody = { response: isString(error.message) ? error.message : 'Request failed' };
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
        parent_id: requestId || 'unknown',
      });
    } catch (recordError) {
      console.warn('Failed to record axios request:', recordError);
    }
  }
}
