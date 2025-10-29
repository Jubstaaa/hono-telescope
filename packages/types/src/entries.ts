import { BaseEntry } from './base';
import { LogLevel, ExceptionClass } from './enums';

// ============ INCOMING REQUEST ============

export interface IncomingRequestEntryData {
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
}

export interface IncomingRequestEntry extends BaseEntry, IncomingRequestEntryData {}

export interface IncomingRequestCreateInput extends IncomingRequestEntryData {}

// ============ OUTGOING REQUEST ============

export interface OutgoingRequestEntryData {
  parent_id?: string;
  method: string;
  uri: string;
  headers: Record<string, string>;
  payload: string;
  response_status: number;
  response_headers: Record<string, string>;
  response: string;
  duration: number;
  user_agent?: string;
}

export interface OutgoingRequestEntry extends BaseEntry, OutgoingRequestEntryData {}

export interface OutgoingRequestCreateInput extends OutgoingRequestEntryData {}

// ============ EXCEPTION ============

export interface ExceptionEntryData {
  parent_id?: string;
  class: ExceptionClass;
  message: string;
  trace: string;
  context?: any;
}

export interface ExceptionEntry extends BaseEntry, ExceptionEntryData {}

export interface ExceptionCreateInput extends ExceptionEntryData {}

// ============ LOG ============

export interface LogEntryData {
  parent_id?: string;
  level: LogLevel;
  message: string;
  context?: any;
}

export interface LogEntry extends BaseEntry, LogEntryData {}

export interface LogCreateInput extends LogEntryData {}

// ============ QUERY ============

export interface QueryEntryData {
  parent_id?: string;
  connection: string;
  query: string;
  bindings: any[];
  time: number;
}

export interface QueryEntry extends BaseEntry, QueryEntryData {}

export interface QueryCreateInput extends QueryEntryData {}

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
