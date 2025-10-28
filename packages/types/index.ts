export interface TelescopeEntry {
  id: string;
  type: EntryType;
  timestamp: number;
  content: any;
  tags?: string[];
  family_hash?: string;
  parent_id?: string; // Parent entry ID for hierarchical structure
  request_id?: string; // Associated incoming request ID
}

export enum EntryType {
  INCOMING_REQUEST = 'incoming_request',
  OUTGOING_REQUEST = 'outgoing_request', 
  EXCEPTION = 'exception',
  LOG = 'log',
  QUERY = 'query',
  CACHE = 'cache',
  JOB = 'job',
  MAIL = 'mail',
  NOTIFICATION = 'notification',
  DUMP = 'dump'
}

// Incoming Request - Incoming requests (parent)
export interface IncomingRequestEntry {
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
  children_count?: number; // Number of child entries (logs, queries, outgoing requests, etc.)
}

// Outgoing Request - Outgoing requests (child)
export interface OutgoingRequestEntry {
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

export interface ExceptionEntry {
  class: string;
  file: string;
  line: number;
  message: string;
  trace: string[];
  context?: any;
}

export interface LogEntry {
  level: string;
  message: string;
  context?: any;
}

export interface QueryEntry {
  connection: string;
  bindings: any[];
  sql: string;
  time: number;
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

export interface TelescopeStorage {
  store(entry: TelescopeEntry): Promise<void>;
  get(type?: EntryType, limit?: number): Promise<TelescopeEntry[]>;
  getEntries(type?: EntryType, limit?: number): Promise<TelescopeEntry[]>;
  getEntry(id: string): Promise<TelescopeEntry | null>;
  getChildEntries(parentId: string): Promise<TelescopeEntry[]>; // Get child entries for a parent
  getIncomingRequestWithChildren(requestId: string): Promise<{
    request: TelescopeEntry;
    children: TelescopeEntry[];
  } | null>; // Get incoming request with all its children
  clear(): Promise<void>;
  count(): Promise<number>;
}
