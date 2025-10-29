export declare class HttpInterceptor {
    private static instance;
    private telescope;
    private contextManager;
    private originalFetch;
    private isIntercepting;
    private axiosIntercepted;
    private constructor();
    static getInstance(): HttpInterceptor;
    startIntercepting(): void;
    stopIntercepting(): void;
    private createInterceptedFetch;
    private sanitizeHeaders;
    private setupAxiosInterceptors;
    private removeAxiosInterceptors;
    private recordAxiosRequest;
}
