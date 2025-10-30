import type {
  IncomingRequestEntry,
  OutgoingRequestEntry,
  ExceptionEntry,
  LogEntry,
  QueryEntry,
  IncomingRequestResponse,
  OutgoingRequestResponse,
  ExceptionResponse,
  LogResponse,
  QueryResponse,
} from '@hono-telescope/types';

export const mapIncomingRequest = (e: IncomingRequestEntry): IncomingRequestResponse => ({
  id: e.id,
  method: e.method,
  uri: e.uri,
  response_status: e.response_status,
  created_at: e.created_at,
  duration: e.duration,
});

export const mapOutgoingRequest = (o: OutgoingRequestEntry): OutgoingRequestResponse => ({
  id: o.id,
  method: o.method,
  uri: o.uri,
  response_status: o.response_status,
  created_at: o.created_at,
  duration: o.duration,
});

export const mapException = (e: ExceptionEntry): ExceptionResponse => ({
  id: e.id,
  class: e.class,
  message: e.message,
  created_at: e.created_at,
});

export const mapLog = (l: LogEntry): LogResponse => ({
  id: l.id,
  level: l.level,
  message: l.message,
  created_at: l.created_at,
});

export const mapQuery = (q: QueryEntry): QueryResponse => ({
  id: q.id,
  connection: q.connection,
  query: q.query,
  time: q.time,
  created_at: q.created_at,
});
