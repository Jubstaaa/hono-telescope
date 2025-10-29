import type { IncomingRequestEntry, OutgoingRequestEntry, ExceptionEntry, LogEntry, QueryEntry, IncomingRequestResponse, OutgoingRequestResponse, ExceptionResponse, LogResponse, QueryResponse } from '@hono-telescope/types';
export declare const mapIncomingRequest: (e: IncomingRequestEntry) => IncomingRequestResponse;
export declare const mapOutgoingRequest: (o: OutgoingRequestEntry) => OutgoingRequestResponse;
export declare const mapException: (e: ExceptionEntry) => ExceptionResponse;
export declare const mapLog: (l: LogEntry) => LogResponse;
export declare const mapQuery: (q: QueryEntry) => QueryResponse;
