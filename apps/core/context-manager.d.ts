export interface RequestContext {
    requestId: string;
    method: string;
    uri: string;
    startTime: number;
}
export declare class ContextManager {
    private static instance;
    private asyncLocalStorage;
    private constructor();
    static getInstance(): ContextManager;
    run<T>(context: RequestContext, callback: () => T): T;
    getCurrentContext(): RequestContext | undefined;
    getCurrentRequestId(): string | undefined;
}
