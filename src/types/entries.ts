import type { BaseEntry } from './base.js';
import type { ExceptionClass, LogLevel } from './enums.js';

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
  | IncomingRequestEntry
  | OutgoingRequestEntry
  | ExceptionEntry
  | LogEntry
  | QueryEntry;

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
