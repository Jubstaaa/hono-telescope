export interface BaseEntry {
  id: string;
  created_at: string;
  parent_id?: string;
  timestamp: number;
}

export type EntryType = 'incoming_request' | 'outgoing_request' | 'exception' | 'log' | 'query';

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

// ============ INCOMING REQUEST ============

export interface IncomingRequestEntryData {
  duration: number;
  headers: Record<string, unknown>;
  ip_address?: string;
  method: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  response_headers: Record<string, unknown>;
  response_status: number;
  uri: string;
  user_agent?: string;
}

export interface IncomingRequestEntry extends BaseEntry, IncomingRequestEntryData {}

export type IncomingRequestCreateInput = IncomingRequestEntryData;

// ============ OUTGOING REQUEST ============

export interface OutgoingRequestEntryData {
  duration: number;
  headers: Record<string, unknown>;
  method: string;
  parent_id?: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  response_headers: Record<string, unknown>;
  response_status: number;
  uri: string;
  user_agent?: string;
}

export interface OutgoingRequestEntry extends BaseEntry, OutgoingRequestEntryData {}

export type OutgoingRequestCreateInput = OutgoingRequestEntryData;

// ============ EXCEPTION ============

export interface ExceptionEntryData {
  class: ExceptionClass;
  context?: Record<string, unknown>;
  message: string;
  parent_id?: string;
  trace: string;
}

export interface ExceptionEntry extends BaseEntry, ExceptionEntryData {}

export type ExceptionCreateInput = ExceptionEntryData;

// ============ LOG ============

export interface LogEntryData {
  context?: Record<string, unknown>;
  level: LogLevel;
  message: string;
  parent_id?: string;
}

export interface LogEntry extends BaseEntry, LogEntryData {}

export type LogCreateInput = LogEntryData;

// ============ QUERY ============

export interface QueryEntryData {
  bindings: string[];
  connection: string;
  error?: string;
  failed?: boolean;
  parent_id?: string;
  query: string;
  time: number;
}

export interface QueryEntry extends BaseEntry, QueryEntryData {}

export type QueryCreateInput = QueryEntryData;

// ============ DISCRIMINATED UNION ============

export type TelescopeEntry =
  IncomingRequestEntry | OutgoingRequestEntry | ExceptionEntry | LogEntry | QueryEntry;

export type TelescopeCreateInput =
  | IncomingRequestCreateInput
  | OutgoingRequestCreateInput
  | ExceptionCreateInput
  | LogCreateInput
  | QueryCreateInput;

// ============ TYPE MAPS ============

export interface EntryMap {
  exception: ExceptionEntry;
  incoming_request: IncomingRequestEntry;
  log: LogEntry;
  outgoing_request: OutgoingRequestEntry;
  query: QueryEntry;
}

export interface CreateInputMap {
  exception: ExceptionCreateInput;
  incoming_request: IncomingRequestCreateInput;
  log: LogCreateInput;
  outgoing_request: OutgoingRequestCreateInput;
  query: QueryCreateInput;
}
