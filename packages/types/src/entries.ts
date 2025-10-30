import { BaseEntry } from './base';
import { LogLevel, ExceptionClass } from './enums';

// ============ INCOMING REQUEST ============

export interface IncomingRequestEntryData {
  method: string;
  uri: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
  response_status: number;
  response_headers: Record<string, string>;
  response: Record<string, unknown>;
  duration: number;
  ip_address?: string;
  user_agent?: string;
}

export interface IncomingRequestEntry extends BaseEntry, IncomingRequestEntryData {}

export type IncomingRequestCreateInput = IncomingRequestEntryData;

// ============ OUTGOING REQUEST ============

export interface OutgoingRequestEntryData {
  parent_id?: string;
  method: string;
  uri: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
  response_status: number;
  response_headers: Record<string, string>;
  response: Record<string, unknown>;
  duration: number;
  user_agent?: string;
}

export interface OutgoingRequestEntry extends BaseEntry, OutgoingRequestEntryData {}

export type OutgoingRequestCreateInput = OutgoingRequestEntryData;

// ============ EXCEPTION ============

export interface ExceptionEntryData {
  parent_id?: string;
  class: ExceptionClass;
  message: string;
  trace: string;
  context?: Record<string, unknown>;
}

export interface ExceptionEntry extends BaseEntry, ExceptionEntryData {}

export type ExceptionCreateInput = ExceptionEntryData;

// ============ LOG ============

export interface LogEntryData {
  parent_id?: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface LogEntry extends BaseEntry, LogEntryData {}

export type LogCreateInput = LogEntryData;

// ============ QUERY ============

export interface QueryEntryData {
  parent_id?: string;
  connection: string;
  query: string;
  bindings: string[];
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
