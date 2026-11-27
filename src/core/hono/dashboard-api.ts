import type {
    ExceptionEntry,
    IncomingRequestEntry,
    LogEntry,
    OutgoingRequestEntry,
    QueryEntry,
} from '../entries.js'

export interface DashboardStats {
    exceptions: {
        total: number
    }
    incomingRequests: {
        total: number
    }
    logs: {
        total: number
    }
    outgoingRequests: {
        total: number
    }
    queries: {
        total: number
    }
}

export type ExceptionDetailResponse = ExceptionEntry

export type ExceptionResponse = Pick<
    ExceptionEntry,
    'class' | 'created_at' | 'id' | 'message'
>

export interface IncomingRequestDetailResponse extends IncomingRequestEntry {
    relation_entries?: {
        exceptions?: ExceptionResponse[]
        logs?: LogResponse[]
        outgoing_requests?: OutgoingRequestResponse[]
        queries?: QueryResponse[]
    }
}

export type IncomingRequestResponse = Pick<
    IncomingRequestEntry,
    'created_at' | 'duration' | 'id' | 'method' | 'response_status' | 'uri'
>

export type LogDetailResponse = LogEntry

export type LogResponse = Pick<
    LogEntry,
    'created_at' | 'id' | 'level' | 'message'
>

export type OutgoingRequestDetailResponse = OutgoingRequestEntry

export type OutgoingRequestResponse = Pick<
    OutgoingRequestEntry,
    'created_at' | 'duration' | 'id' | 'method' | 'response_status' | 'uri'
>

export type QueryDetailResponse = QueryEntry

export type QueryResponse = Pick<
    QueryEntry,
    'connection' | 'created_at' | 'failed' | 'id' | 'query' | 'time'
>

export type TelescopeDetailResponse =
    | ExceptionDetailResponse
    | IncomingRequestDetailResponse
    | LogDetailResponse
    | OutgoingRequestDetailResponse
    | QueryDetailResponse

export type TelescopeListResponse =
    | ExceptionResponse
    | IncomingRequestResponse
    | LogResponse
    | OutgoingRequestResponse
    | QueryResponse

export const mapIncomingRequest = (
    e: IncomingRequestEntry
): IncomingRequestResponse => ({
    created_at: e.created_at,
    duration: e.duration,
    id: e.id,
    method: e.method,
    response_status: e.response_status,
    uri: e.uri,
})

export const mapOutgoingRequest = (
    o: OutgoingRequestEntry
): OutgoingRequestResponse => ({
    created_at: o.created_at,
    duration: o.duration,
    id: o.id,
    method: o.method,
    response_status: o.response_status,
    uri: o.uri,
})

export const mapException = (e: ExceptionEntry): ExceptionResponse => ({
    class: e.class,
    created_at: e.created_at,
    id: e.id,
    message: e.message,
})

export const mapLog = (l: LogEntry): LogResponse => ({
    created_at: l.created_at,
    id: l.id,
    level: l.level,
    message: l.message,
})

export const mapQuery = (q: QueryEntry): QueryResponse => ({
    connection: q.connection,
    created_at: q.created_at,
    failed: q.failed,
    id: q.id,
    query: q.query,
    time: q.time,
})
