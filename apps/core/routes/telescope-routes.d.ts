import type { Context } from 'hono';
export declare class TelescopeRoutes {
    private dashboard;
    constructor();
    getDashboard(c: Context): Promise<Response>;
    getStats(c: Context): Promise<(Response & import("hono").TypedResponse<{
        incomingRequests: {
            total: number;
        };
        outgoingRequests: {
            total: number;
        };
        exceptions: {
            total: number;
        };
        queries: {
            total: number;
        };
        logs: {
            total: number;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getAsset(c: Context): Promise<Response>;
    getIncomingRequests(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: string;
        method: string;
        uri: string;
        response_status: number;
        created_at: string;
        duration: number;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getIncomingRequest(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        relation_entries: {
            logs: {
                id: string;
                created_at: string;
                message: string;
                level: import("@hono-telescope/types").LogLevel;
            }[];
            queries: {
                query: string;
                id: string;
                created_at: string;
                connection: string;
                time: number;
            }[];
            exceptions: {
                id: string;
                created_at: string;
                class: import("@hono-telescope/types").ExceptionClass;
                message: string;
            }[];
            outgoing_requests: {
                id: string;
                method: string;
                uri: string;
                response_status: number;
                created_at: string;
                duration: number;
            }[];
        };
        id: string;
        timestamp: number;
        created_at: string;
        parent_id?: string | undefined;
        method: string;
        uri: string;
        headers: {
            [x: string]: string;
        };
        payload: string;
        response_status: number;
        response_headers: {
            [x: string]: string;
        };
        response: string;
        duration: number;
        ip_address?: string | undefined;
        user_agent?: string | undefined;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getOutgoingRequests(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: string;
        method: string;
        uri: string;
        response_status: number;
        created_at: string;
        duration: number;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getOutgoingRequest(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        id: string;
        timestamp: number;
        created_at: string;
        parent_id?: string | undefined;
        method: string;
        uri: string;
        headers: {
            [x: string]: string;
        };
        payload: string;
        response_status: number;
        response_headers: {
            [x: string]: string;
        };
        response: string;
        duration: number;
        user_agent?: string | undefined;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getExceptions(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: string;
        created_at: string;
        class: import("@hono-telescope/types").ExceptionClass;
        message: string;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getException(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        id: string;
        timestamp: number;
        created_at: string;
        parent_id?: string | undefined;
        class: import("@hono-telescope/types").ExceptionClass;
        message: string;
        trace: string;
        context?: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getQueries(c: Context): Promise<(Response & import("hono").TypedResponse<{
        query: string;
        id: string;
        created_at: string;
        connection: string;
        time: number;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getQuery(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        id: string;
        timestamp: number;
        created_at: string;
        parent_id?: string | undefined;
        connection: string;
        query: string;
        bindings: any[];
        time: number;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getLogs(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: string;
        created_at: string;
        message: string;
        level: import("@hono-telescope/types").LogLevel;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    getLog(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        id: string;
        timestamp: number;
        created_at: string;
        parent_id?: string | undefined;
        level: import("@hono-telescope/types").LogLevel;
        message: string;
        context?: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
