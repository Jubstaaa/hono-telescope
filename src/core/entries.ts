export enum ExceptionClass {
    ERROR = 0,
    EXCEPTION = 1,
    RUNTIME_ERROR = 2,
    TYPE_ERROR = 3,
    SYNTAX_ERROR = 4,
    REFERENCE_ERROR = 5,
    RANGE_ERROR = 6,
    VALIDATION_ERROR = 7,
    NOT_FOUND = 8,
    UNAUTHORIZED = 9,
    FORBIDDEN = 10,
    BAD_REQUEST = 11,
    INTERNAL_SERVER_ERROR = 12,
}

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    NOTICE = 2,
    WARNING = 3,
    ERROR = 4,
    CRITICAL = 5,
    ALERT = 6,
    EMERGENCY = 7,
}

export interface BaseEntry {
    created_at: string
    id: string
    parent_id?: string | undefined
    timestamp: number
}

export interface CreateInputMap {
    exception: ExceptionCreateInput
    incoming_request: IncomingRequestCreateInput
    log: LogCreateInput
    outgoing_request: OutgoingRequestCreateInput
    query: QueryCreateInput
}

export interface EntryMap {
    exception: ExceptionEntry
    incoming_request: IncomingRequestEntry
    log: LogEntry
    outgoing_request: OutgoingRequestEntry
    query: QueryEntry
}

export type EntryType =
    'exception' | 'incoming_request' | 'log' | 'outgoing_request' | 'query'

export type ExceptionCreateInput = ExceptionEntryData

export interface ExceptionEntry extends BaseEntry, ExceptionEntryData {}

export interface ExceptionEntryData {
    class: ExceptionClass
    context?: Record<string, unknown> | undefined
    message: string
    parent_id?: string | undefined
    trace: string
}

export type IncomingRequestCreateInput = IncomingRequestEntryData

export interface IncomingRequestEntry
    extends BaseEntry, IncomingRequestEntryData {}

export interface IncomingRequestEntryData {
    duration: number
    headers: Record<string, unknown>
    ip_address?: string | undefined
    method: string
    payload: Record<string, unknown>
    response: Record<string, unknown>
    response_headers: Record<string, unknown>
    response_status: number
    uri: string
    user_agent?: string | undefined
}

export type LogCreateInput = LogEntryData

export interface LogEntry extends BaseEntry, LogEntryData {}

export interface LogEntryData {
    context?: Record<string, unknown> | undefined
    level: LogLevel
    message: string
    parent_id?: string | undefined
}

export type OutgoingRequestCreateInput = OutgoingRequestEntryData

export interface OutgoingRequestEntry
    extends BaseEntry, OutgoingRequestEntryData {}

export interface OutgoingRequestEntryData {
    duration: number
    headers: Record<string, unknown>
    method: string
    parent_id?: string | undefined
    payload: Record<string, unknown>
    response: Record<string, unknown>
    response_headers: Record<string, unknown>
    response_status: number
    uri: string
    user_agent?: string | undefined
}

export type QueryCreateInput = QueryEntryData

export interface QueryEntry extends BaseEntry, QueryEntryData {}

export interface QueryEntryData {
    bindings: string[]
    connection: string
    error?: string | undefined
    failed?: boolean | undefined
    parent_id?: string | undefined
    query: string
    time: number
}

export type TelescopeCreateInput =
    | ExceptionCreateInput
    | IncomingRequestCreateInput
    | LogCreateInput
    | OutgoingRequestCreateInput
    | QueryCreateInput

export type TelescopeEntry =
    | ExceptionEntry
    | IncomingRequestEntry
    | LogEntry
    | OutgoingRequestEntry
    | QueryEntry
