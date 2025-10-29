// Base entry interface - tüm ortak alanlar
interface BaseEntry {
  id: string;
  timestamp: number; // Unix milliseconds
  created_at: string; // ISO string
  parent_id?: string; // Child entries için parent bağlantısı
}

export enum EntryType {
  INCOMING_REQUEST = 'incoming_request',
  OUTGOING_REQUEST = 'outgoing_request', 
  EXCEPTION = 'exception',
  LOG = 'log',
  QUERY = 'query',
  CACHE = 'cache',
}

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  NOTICE: 2,
  WARNING: 3,
  ERROR: 4,
  CRITICAL: 5,
  ALERT: 6,
  EMERGENCY: 7
} as const;

export type LogLevel = number;

export const EXCEPTION_CLASSES = {
  ERROR: 0,
  EXCEPTION: 1,
  RUNTIME_ERROR: 2,
  TYPE_ERROR: 3,
  SYNTAX_ERROR: 4,
  REFERENCE_ERROR: 5,
  RANGE_ERROR: 6,
  VALIDATION_ERROR: 7,
  NOT_FOUND: 8,
  UNAUTHORIZED: 9,
  FORBIDDEN: 10,
  BAD_REQUEST: 11,
  INTERNAL_SERVER_ERROR: 12
} as const;

export type ExceptionClass = number;

// Type-safe entry interfaces - Discriminated Union pattern
export interface IncomingRequestEntry extends BaseEntry {
  type: EntryType.INCOMING_REQUEST;
  method: string;
  uri: string;
  headers: Record<string, string>;
  payload?: any;
  response_status: number;
  response_headers: Record<string, string>;
  response?: any;
  duration: number;
  memory: number;
  ip_address?: string;
  user_agent?: string;
}

export interface OutgoingRequestEntry extends BaseEntry {
  type: EntryType.OUTGOING_REQUEST;
  parent_id: string; // Bağlı incoming request ID
  method: string;
  uri: string;
  headers: Record<string, string>;
  payload?: any;
  response_status: number;
  response_headers: Record<string, string>;
  response?: any;
  duration: number;
  memory: number;
  ip_address?: string;
  user_agent?: string;
}

export interface ExceptionEntryData extends BaseEntry {
  type: EntryType.EXCEPTION;
  parent_id?: string; // Optional parent (incoming request)
  class: ExceptionClass;
  file: string;
  line: number;
  message: string;
  trace: string[];
  context?: any;
}

export interface LogEntryData extends BaseEntry {
  type: EntryType.LOG;
  parent_id?: string; // Optional parent (incoming request)
  level: LogLevel;
  message: string;
  context?: any;
}

export interface QueryEntryData extends BaseEntry {
  type: EntryType.QUERY;
  parent_id?: string; // Optional parent (incoming request)
  connection: string;
  query: string;
  bindings: any[];
  time: number;
}

// Discriminated Union - tüm entry types
export type TelescopeEntry = 
  | IncomingRequestEntry 
  | OutgoingRequestEntry 
  | ExceptionEntryData 
  | LogEntryData 
  | QueryEntryData;

// Type guards - runtime type checking
export function isIncomingRequest(entry: TelescopeEntry): entry is IncomingRequestEntry {
  return entry.type === EntryType.INCOMING_REQUEST;
}

export function isOutgoingRequest(entry: TelescopeEntry): entry is OutgoingRequestEntry {
  return entry.type === EntryType.OUTGOING_REQUEST;
}

export function isException(entry: TelescopeEntry): entry is ExceptionEntryData {
  return entry.type === EntryType.EXCEPTION;
}

export function isLog(entry: TelescopeEntry): entry is LogEntryData {
  return entry.type === EntryType.LOG;
}

export function isQuery(entry: TelescopeEntry): entry is QueryEntryData {
  return entry.type === EntryType.QUERY;
}

// Helpers for safe type access
export function getEntryContent(entry: TelescopeEntry) {
  if (isIncomingRequest(entry)) {
    return {
      method: entry.method,
      uri: entry.uri,
      headers: entry.headers,
      payload: entry.payload,
      response_status: entry.response_status,
      response_headers: entry.response_headers,
      response: entry.response,
      duration: entry.duration,
      memory: entry.memory,
    };
  } else if (isOutgoingRequest(entry)) {
    return {
      method: entry.method,
      uri: entry.uri,
      headers: entry.headers,
      payload: entry.payload,
      response_status: entry.response_status,
      response_headers: entry.response_headers,
      response: entry.response,
      duration: entry.duration,
      memory: entry.memory,
    };
  } else if (isException(entry)) {
    return {
      class: entry.class,
      file: entry.file,
      line: entry.line,
      message: entry.message,
      trace: entry.trace,
      context: entry.context,
    };
  } else if (isLog(entry)) {
    return {
      level: entry.level,
      message: entry.message,
      context: entry.context,
    };
  } else if (isQuery(entry)) {
    return {
      connection: entry.connection,
      query: entry.query,
      bindings: entry.bindings,
      time: entry.time,
    };
  }
  return {};
}

export interface TelescopeConfig {
  enabled: boolean;
  path: string;
  storage: 'memory' | 'file';
  ignore_paths?: string[];
  ignore_commands?: string[];
  watchers?: {
    [key in EntryType]?: boolean;
  };
  max_entries?: number;
}

// Clean Repository Pattern - Database-like operations
export interface ITelescopeRepository {
  // Create
  create(entry: TelescopeEntry): Promise<string>; // Returns entry ID
  
  // Read
  findById(id: string): Promise<TelescopeEntry | null>;
  findByType(type: EntryType, limit?: number): Promise<TelescopeEntry[]>;
  findAll(limit?: number): Promise<TelescopeEntry[]>;
  
  // Parent-Child queries (One-to-Many)
  findByParentId(parentId: string, limit?: number): Promise<TelescopeEntry[]>;
  findIncomingWithChildren(incomingRequestId: string): Promise<{
    parent: IncomingRequestEntry;
    children: TelescopeEntry[];
  } | null>;
  
  // Aggregation
  count(type?: EntryType): Promise<number>;
  
  // Cleanup
  clear(): Promise<void>;
  deleteOldEntries(beforeTimestamp: number): Promise<number>; // Returns deleted count
}

// Legacy interface support (backwards compatibility)
export interface TelescopeStorage extends ITelescopeRepository {
  store(entry: TelescopeEntry): Promise<void>;
  get(type?: EntryType, limit?: number): Promise<TelescopeEntry[]>;
  getEntries(type?: EntryType, limit?: number): Promise<TelescopeEntry[]>;
  getEntry(id: string): Promise<TelescopeEntry | null>;
  getChildEntries(parentId: string): Promise<TelescopeEntry[]>;
  getIncomingRequestWithChildren(requestId: string): Promise<{
    request: TelescopeEntry;
    children: TelescopeEntry[];
  } | null>;
}

// Dashboard UI Types
export interface TelescopeStats {
  total_entries: number;
  requests: {
    total: number;
    avg_duration: number;
  };
  exceptions: {
    total: number;
  };
}

export type TabType = 
  | 'dashboard' 
  | 'requests' 
  | 'incoming-requests'
  | 'outgoing-requests'
  | 'queries' 
  | 'exceptions' 
