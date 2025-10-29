export declare class TelescopeDashboard {
    private telescope;
    constructor();
    getAllIncomingRequests(): Promise<import("@hono-telescope/types").IncomingRequestResponse[]>;
    getIncomingRequest(id: string): Promise<{
        relation_entries: {
            logs: import("@hono-telescope/types").LogResponse[];
            queries: import("@hono-telescope/types").QueryResponse[];
            exceptions: import("@hono-telescope/types").ExceptionResponse[];
            outgoing_requests: import("@hono-telescope/types").OutgoingRequestResponse[];
        };
        id: string;
        timestamp: number;
        created_at: string;
        parent_id?: string;
        method: string;
        uri: string;
        headers: Record<string, string>;
        payload: string;
        response_status: number;
        response_headers: Record<string, string>;
        response: string;
        duration: number;
        ip_address?: string;
        user_agent?: string;
    } | null>;
    getAllOutgoingRequests(): Promise<import("@hono-telescope/types").OutgoingRequestResponse[]>;
    getOutgoingRequest(id: string): Promise<import("@hono-telescope/types").OutgoingRequestEntry | null>;
    getAllExceptions(): Promise<import("@hono-telescope/types").ExceptionResponse[]>;
    getException(id: string): Promise<import("@hono-telescope/types").ExceptionEntry | null>;
    getAllQueries(): Promise<import("@hono-telescope/types").QueryResponse[]>;
    getQuery(id: string): Promise<import("@hono-telescope/types").QueryEntry | null>;
    getAllLogs(): Promise<import("@hono-telescope/types").LogResponse[]>;
    getLog(id: string): Promise<import("@hono-telescope/types").LogEntry | null>;
    getStats(): Promise<{
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
    }>;
    getDashboardHtml(): string;
    getAsset(path: string): string | null;
}
