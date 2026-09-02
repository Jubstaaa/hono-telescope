import type {
  EntryMap,
  EntryType,
  ExceptionEntry,
  IncomingRequestEntry,
  LogEntry,
  OutgoingRequestEntry,
  QueryEntry,
} from '../../types/index.js';
import type { Recorder } from '../recorder.js';

export const PAGE_SIZE = 100;
export const MAX_SCAN = 500;
export const TRACE_CAP = 2000;
export const QUERY_CAP = 2000;
export const MESSAGE_CAP = 1000;

export interface RequestFilters {
  limit: number;
  minDuration?: number;
  minStatus?: number;
  status?: number;
  uriContains?: string;
}

export interface ScanResult {
  scanLimitReached: boolean;
  scanned: number;
}

export interface McpReader {
  recentExceptions(limit: number): Promise<{ exceptions: unknown[] }>;
  recentRequests(opts: RequestFilters): Promise<{ requests: unknown[] } & ScanResult>;
  requestDetail(id: string): Promise<{ request: unknown } | null>;
  slowQueries(opts: { limit: number; minMs: number }): Promise<{ queries: unknown[] } & ScanResult>;
  stats(): Promise<Record<string, { total: number }>>;
}

function cap(text: string, limit: number): { truncated: boolean; value: string } {
  return text.length > limit
    ? { truncated: true, value: text.slice(0, limit) }
    : { truncated: false, value: text };
}

// `scanLimitReached` distinguishes "the budget stopped us" from "the store ran out":
// an empty result otherwise cannot tell a caller whether to narrow the filter or to
// give up.
async function scanAll<T extends EntryType>(
  recorder: Recorder,
  type: T,
  predicate: (entry: EntryMap[T]) => boolean
): Promise<{ matches: EntryMap[T][] } & ScanResult> {
  const matches: EntryMap[T][] = [];
  let scanned = 0;
  let offset = 0;
  let scanLimitReached = false;

  for (;;) {
    const page = await recorder.list(type, { limit: PAGE_SIZE, offset });
    if (page.length === 0) break;

    for (const entry of page) {
      if (scanned === MAX_SCAN) {
        scanLimitReached = true;
        break;
      }
      scanned += 1;
      if (predicate(entry)) matches.push(entry);
    }

    if (scanLimitReached) break;
    offset += page.length;
  }

  return { matches, scanLimitReached, scanned };
}

const logSummary = (log: LogEntry) => {
  const message = cap(log.message, MESSAGE_CAP);

  return {
    created_at: log.created_at,
    id: log.id,
    level: log.level,
    message: message.value,
    ...(message.truncated ? { truncated: true as const } : {}),
  };
};

const querySummary = (query: QueryEntry) => {
  const sql = cap(query.query, QUERY_CAP);

  return {
    bindings: query.bindings,
    connection: query.connection,
    created_at: query.created_at,
    id: query.id,
    query: sql.value,
    time: query.time,
    ...(query.failed ? { error: query.error, failed: true as const } : {}),
    ...(sql.truncated ? { truncated: true as const } : {}),
  };
};

const outgoingSummary = (outgoing: OutgoingRequestEntry) => ({
  created_at: outgoing.created_at,
  duration: outgoing.duration,
  id: outgoing.id,
  method: outgoing.method,
  response_status: outgoing.response_status,
  uri: outgoing.uri,
});

const requestSummary = (request: IncomingRequestEntry) => ({
  created_at: request.created_at,
  duration: request.duration,
  id: request.id,
  method: request.method,
  response_status: request.response_status,
  uri: request.uri,
});

export function createMcpReader(recorder: Recorder): McpReader {
  const children = (parentId: string) =>
    Promise.all([
      recorder.findByParent('log', parentId),
      recorder.findByParent('query', parentId),
      recorder.findByParent('exception', parentId),
      recorder.findByParent('outgoing_request', parentId),
    ]);

  return {
    async recentExceptions(limit) {
      const entries = await recorder.list('exception', { limit });

      const exceptions = await Promise.all(
        entries.map(async (entry: ExceptionEntry) => {
          const trace = cap(entry.trace, TRACE_CAP);
          const message = cap(entry.message, MESSAGE_CAP);
          const base = {
            class: entry.class,
            created_at: entry.created_at,
            id: entry.id,
            message: message.value,
            trace: trace.value,
            ...(trace.truncated || message.truncated ? { truncated: true as const } : {}),
          };

          if (entry.parent_id === undefined) return base;

          const request = await recorder.find('incoming_request', entry.parent_id);
          if (request === null) return base;

          const [logs, queries, , outgoing] = await children(entry.parent_id);

          return {
            ...base,
            logs: logs.map(logSummary),
            outgoing: outgoing.map(outgoingSummary),
            queries: queries.map(querySummary),
            request: requestSummary(request),
          };
        })
      );

      return { exceptions };
    },

    async recentRequests({ limit, minDuration, minStatus, status, uriContains }) {
      const { matches, scanLimitReached, scanned } = await scanAll(
        recorder,
        'incoming_request',
        (entry) =>
          (status === undefined || entry.response_status === status) &&
          (minStatus === undefined || entry.response_status >= minStatus) &&
          (minDuration === undefined || entry.duration >= minDuration) &&
          (uriContains === undefined || entry.uri.includes(uriContains))
      );

      const requests = await Promise.all(
        matches.slice(0, limit).map(async (entry) => {
          const [logs, queries, exceptions, outgoing] = await children(entry.id);

          return {
            ...requestSummary(entry),
            counts: {
              exceptions: exceptions.length,
              logs: logs.length,
              outgoing: outgoing.length,
              queries: queries.length,
            },
          };
        })
      );

      return { requests, scanLimitReached, scanned };
    },

    async requestDetail(id) {
      const request = await recorder.find('incoming_request', id);
      if (request === null) return null;

      const [logs, queries, exceptions, outgoing] = await children(id);

      return { request: { ...request, exceptions, logs, outgoing, queries } };
    },

    async slowQueries({ limit, minMs }) {
      const { matches, scanLimitReached, scanned } = await scanAll(
        recorder,
        'query',
        (entry) => entry.time >= minMs
      );

      const slowest = [...matches].sort((a, b) => b.time - a.time).slice(0, limit);

      const queries = await Promise.all(
        slowest.map(async (entry) => {
          const summary = querySummary(entry);
          if (entry.parent_id === undefined) return summary;

          const request = await recorder.find('incoming_request', entry.parent_id);

          return request === null ? summary : { ...summary, request: requestSummary(request) };
        })
      );

      return { queries, scanLimitReached, scanned };
    },

    async stats() {
      const [incomingRequests, outgoingRequests, exceptions, queries, logs] = await Promise.all([
        recorder.count('incoming_request'),
        recorder.count('outgoing_request'),
        recorder.count('exception'),
        recorder.count('query'),
        recorder.count('log'),
      ]);

      return {
        exceptions: { total: exceptions },
        incomingRequests: { total: incomingRequests },
        logs: { total: logs },
        outgoingRequests: { total: outgoingRequests },
        queries: { total: queries },
      };
    },
  };
}
