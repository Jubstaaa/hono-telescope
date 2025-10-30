import {
  IncomingRequestEntry,
  OutgoingRequestEntry,
  ExceptionEntry,
  LogEntry,
  QueryEntry
} from './entries';

export interface DashboardStats {
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
}

// ============ API LIST RESPONSES ============

export type IncomingRequestResponse = Pick<IncomingRequestEntry, 'id' | 'method' | 'uri' | 'response_status' | 'created_at' | 'duration'>;

export type OutgoingRequestResponse = Pick<OutgoingRequestEntry, 'id' | 'method' | 'uri' | 'response_status' | 'created_at' | 'duration'>;

export type ExceptionResponse = Pick<ExceptionEntry, 'id' | 'class' | 'message' | 'created_at'>;

export type LogResponse = Pick<LogEntry, 'id' | 'level' | 'message' | 'created_at'>;

export type QueryResponse = Pick<QueryEntry, 'id' | 'connection' | 'query' | 'time' | 'created_at'>;

export type TelescopeListResponse =
  | IncomingRequestResponse
  | OutgoingRequestResponse
  | ExceptionResponse
  | LogResponse
  | QueryResponse;

// ============ API DETAIL RESPONSES ============

export interface IncomingRequestDetailResponse extends IncomingRequestEntry {
  relation_entries?: {
    outgoing_requests?: OutgoingRequestResponse[];
    exceptions?: ExceptionResponse[];
    logs?: LogResponse[];
    queries?: QueryResponse[];
  };
}

export type OutgoingRequestDetailResponse = OutgoingRequestEntry;

export type ExceptionDetailResponse = ExceptionEntry;

export type LogDetailResponse = LogEntry;

export type QueryDetailResponse = QueryEntry;

export type TelescopeDetailResponse =
  | IncomingRequestDetailResponse
  | OutgoingRequestDetailResponse
  | ExceptionDetailResponse
  | LogDetailResponse
  | QueryDetailResponse;
