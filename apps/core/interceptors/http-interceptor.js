import { Telescope } from '../telescope';
import { ContextManager } from '../context-manager';
import { forEach } from 'lodash';
export class HttpInterceptor {
    static instance;
    telescope;
    contextManager;
    originalFetch;
    isIntercepting = false;
    axiosIntercepted = false;
    constructor() {
        this.telescope = Telescope.getInstance();
        this.contextManager = ContextManager.getInstance();
        this.originalFetch = globalThis.fetch;
    }
    static getInstance() {
        if (!HttpInterceptor.instance) {
            HttpInterceptor.instance = new HttpInterceptor();
        }
        return HttpInterceptor.instance;
    }
    startIntercepting() {
        if (this.isIntercepting)
            return;
        this.isIntercepting = true;
        globalThis.fetch = this.createInterceptedFetch();
        this.setupAxiosInterceptors();
    }
    stopIntercepting() {
        if (!this.isIntercepting)
            return;
        this.isIntercepting = false;
        globalThis.fetch = this.originalFetch;
        this.removeAxiosInterceptors();
    }
    createInterceptedFetch() {
        const originalFetch = this.originalFetch;
        const telescope = this.telescope;
        const contextManager = this.contextManager;
        const sanitizeHeaders = this.sanitizeHeaders.bind(this);
        return async function interceptedFetch(input, init) {
            const startTime = Date.now();
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            const method = init?.method || 'GET';
            const headers = init?.headers || {};
            let requestBody = null;
            if (init?.body) {
                try {
                    if (typeof init.body === 'string') {
                        try {
                            requestBody = JSON.parse(init.body);
                        }
                        catch {
                            requestBody = init.body;
                        }
                    }
                    else {
                        requestBody = init.body.toString();
                    }
                }
                catch {
                    requestBody = '[Binary Data]';
                }
            }
            let response;
            let responseBody = null;
            let error = null;
            try {
                response = await originalFetch(input, init);
                try {
                    const responseClone = response.clone();
                    const text = await responseClone.text();
                    if (text) {
                        try {
                            responseBody = JSON.parse(text);
                        }
                        catch {
                            responseBody = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
                        }
                    }
                }
                catch {
                    responseBody = '[Unable to capture response]';
                }
            }
            catch (err) {
                error = err;
                response = new Response(null, {
                    status: 0,
                    statusText: 'Network Error'
                });
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            const responseHeaders = {};
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
    sanitizeHeaders(headers) {
        const sanitized = {};
        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                sanitized[key.toLowerCase()] = value;
            });
        }
        else if (typeof headers === 'object' && headers !== null) {
            forEach(headers, (value, key) => {
                sanitized[key.toLowerCase()] = String(value);
            });
        }
        return sanitized;
    }
    setupAxiosInterceptors() {
        let axios = null;
        if (typeof globalThis !== 'undefined' && globalThis.axios) {
            axios = globalThis.axios;
        }
        else if (typeof window !== 'undefined' && window.axios) {
            axios = window.axios;
        }
        else {
            try {
                axios = require('axios');
            }
            catch {
                try {
                    const axiosModule = eval('require("axios")');
                    axios = axiosModule.default || axiosModule;
                }
                catch {
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
        axios.interceptors.request.use((config) => {
            config._telescopeStartTime = Date.now();
            return config;
        }, (error) => Promise.reject(error));
        axios.interceptors.response.use(async (response) => {
            await this.recordAxiosRequest(response.config, response, null);
            return response;
        }, async (error) => {
            if (error.config) {
                await this.recordAxiosRequest(error.config, error.response, error);
            }
            return Promise.reject(error);
        });
        this.axiosIntercepted = true;
    }
    removeAxiosInterceptors() {
        let axios = null;
        if (typeof globalThis !== 'undefined' && globalThis.axios) {
            axios = globalThis.axios;
        }
        else {
            try {
                axios = require('axios');
            }
            catch {
                return;
            }
        }
        if (axios && this.axiosIntercepted) {
            axios.interceptors.request.clear();
            axios.interceptors.response.clear();
            this.axiosIntercepted = false;
        }
    }
    async recordAxiosRequest(config, response, error) {
        try {
            const endTime = Date.now();
            const startTime = config._telescopeStartTime || endTime;
            const duration = endTime - startTime;
            const url = config.url || '';
            const method = (config.method || 'GET').toUpperCase();
            let requestBody = null;
            if (config.data) {
                try {
                    requestBody = typeof config.data === 'string' ?
                        (config.data.length > 1000 ? config.data.substring(0, 1000) + '...' : config.data) :
                        config.data;
                }
                catch {
                    requestBody = '[Unable to serialize request data]';
                }
            }
            let responseBody = null;
            let responseStatus = 0;
            let responseHeaders = {};
            if (response) {
                responseStatus = response.status || 0;
                responseHeaders = this.sanitizeHeaders(response.headers || {});
                try {
                    responseBody = response.data;
                    if (typeof responseBody === 'string' && responseBody.length > 1000) {
                        responseBody = responseBody.substring(0, 1000) + '...';
                    }
                }
                catch {
                    responseBody = '[Unable to capture response]';
                }
            }
            else if (error) {
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
        }
        catch (recordError) {
            console.warn('Failed to record axios request:', recordError);
        }
    }
}
