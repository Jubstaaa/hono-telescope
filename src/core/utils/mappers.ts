import type {
  ExceptionEntry,
  ExceptionResponse,
  IncomingRequestEntry,
  IncomingRequestResponse,
  LogEntry,
  LogResponse,
  OutgoingRequestEntry,
  OutgoingRequestResponse,
  QueryEntry,
  QueryResponse,
} from '../../types/index.js';

export const mapIncomingRequest = (e: IncomingRequestEntry): IncomingRequestResponse => ({
  created_at: e.created_at,
  duration: e.duration,
  id: e.id,
  method: e.method,
  response_status: e.response_status,
  uri: e.uri,
});

export const mapOutgoingRequest = (o: OutgoingRequestEntry): OutgoingRequestResponse => ({
  created_at: o.created_at,
  duration: o.duration,
  id: o.id,
  method: o.method,
  response_status: o.response_status,
  uri: o.uri,
});

export const mapException = (e: ExceptionEntry): ExceptionResponse => ({
  class: e.class,
  created_at: e.created_at,
  id: e.id,
  message: e.message,
});

export const mapLog = (l: LogEntry): LogResponse => ({
  created_at: l.created_at,
  id: l.id,
  level: l.level,
  message: l.message,
});

export const mapQuery = (q: QueryEntry): QueryResponse => ({
  connection: q.connection,
  created_at: q.created_at,
  failed: q.failed,
  id: q.id,
  query: q.query,
  time: q.time,
});
