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

export interface IncomingRequestResponse extends Pick<IncomingRequestEntry, 'id' | 'method' | 'uri' | 'response_status' | 'created_at' | 'duration'> {}

export interface OutgoingRequestResponse extends Pick<OutgoingRequestEntry, 'id' | 'method' | 'uri' | 'response_status' | 'created_at' | 'duration'> {}

export interface ExceptionResponse extends Pick<ExceptionEntry, 'id' | 'class' | 'message' | 'created_at'> {}

export interface LogResponse extends Pick<LogEntry, 'id' | 'level' | 'message' | 'created_at'> {}

export interface QueryResponse extends Pick<QueryEntry, 'id' | 'connection' | 'query' | 'time' | 'created_at'> {}

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

export interface OutgoingRequestDetailResponse extends OutgoingRequestEntry {}

export interface ExceptionDetailResponse extends ExceptionEntry {}

export interface LogDetailResponse extends LogEntry {}

export interface QueryDetailResponse extends QueryEntry {}

export type TelescopeDetailResponse =
  | IncomingRequestDetailResponse
  | OutgoingRequestDetailResponse
  | ExceptionDetailResponse
  | LogDetailResponse
  | QueryDetailResponse;
