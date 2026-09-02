import type { McpReader } from './reader.js';

export interface ToolAnnotations {
  openWorldHint: boolean;
  readOnlyHint: boolean;
}

export interface ToolDefinition {
  annotations: ToolAnnotations;
  description: string;
  inputSchema: Record<string, unknown>;
  name: string;
  title: string;
}

export type ToolOutcome =
  | {
      content: [{ text: string; type: 'text' }];
      isError?: true;
      kind: 'ok';
      structuredContent: unknown;
    }
  | { kind: 'invalidParams'; message: string };

const READ_ONLY: ToolAnnotations = { openWorldHint: false, readOnlyHint: true };

const limitSchema = (max: number, fallback: number, description: string) => ({
  default: fallback,
  description,
  maximum: max,
  minimum: 1,
  type: 'integer',
});

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    annotations: READ_ONLY,
    description:
      "The most recent exceptions, each with the request that produced it and that request's logs, queries and outgoing calls. Start here when something failed.",
    inputSchema: {
      additionalProperties: false,
      properties: {
        limit: limitSchema(50, 5, 'How many exceptions to return, most recent first.'),
      },
      type: 'object',
    },
    name: 'recent_exceptions',
    title: 'Recent exceptions',
  },
  {
    annotations: READ_ONLY,
    description:
      'Recent incoming requests with child counts. Filter with minStatus: 400 to find failures that returned an error status without throwing.',
    inputSchema: {
      additionalProperties: false,
      properties: {
        limit: limitSchema(100, 20, 'How many requests to return, most recent first.'),
        minDuration: {
          description: 'Only requests that took at least this many milliseconds.',
          type: 'number',
        },
        minStatus: { description: 'Inclusive lower bound on response status', type: 'integer' },
        status: { description: 'Exact response status', type: 'integer' },
        uriContains: {
          description: 'Case-sensitive substring the request path must contain.',
          type: 'string',
        },
      },
      type: 'object',
    },
    name: 'recent_requests',
    title: 'Recent requests',
  },
  {
    annotations: READ_ONLY,
    description:
      'One request in full — headers, payload, response body — with every log, query, exception and outgoing call recorded inside it. Nothing is truncated. Reach for it once a list tool has narrowed the search to one request.',
    inputSchema: {
      additionalProperties: false,
      properties: {
        id: {
          description:
            'An incoming request id: the `id` of a recent_requests result, or the `request.id` attached to a recent_exceptions or slow_queries result.',
          type: 'string',
        },
      },
      required: ['id'],
      type: 'object',
    },
    name: 'request_detail',
    title: 'Request detail',
  },
  {
    annotations: READ_ONLY,
    description:
      'Recent database queries sorted slowest first, each with the request it ran in. Use request_detail on that request to see everything else it did.',
    inputSchema: {
      additionalProperties: false,
      properties: {
        limit: limitSchema(100, 10, 'How many queries to return, slowest first.'),
        minMs: {
          default: 0,
          description: 'Only queries that took at least this many milliseconds.',
          minimum: 0,
          type: 'number',
        },
      },
      type: 'object',
    },
    name: 'slow_queries',
    title: 'Slow queries',
  },
  {
    annotations: READ_ONLY,
    description:
      'How many entries of each type Telescope is holding right now. The counts cover what is still retained: the oldest entries are dropped once storage reaches maxEntries. Read it first to see whether there is anything to look at, then drill in with recent_exceptions or recent_requests.',
    inputSchema: { additionalProperties: false, properties: {}, type: 'object' },
    name: 'stats',
    title: 'Telemetry counts',
  },
];

class InvalidParams extends Error {}

function record(args: unknown): Record<string, unknown> {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) {
    throw new InvalidParams('arguments must be an object');
  }

  return args as Record<string, unknown>;
}

function intArg(args: Record<string, unknown>, key: string, fallback: number, max: number): number {
  const raw = args[key];
  if (raw === undefined) return fallback;
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1 || raw > max) {
    throw new InvalidParams(`${key} must be an integer between 1 and ${max}`);
  }

  return raw;
}

function numberArg(args: Record<string, unknown>, key: string, min: number): number | undefined {
  const raw = args[key];
  if (raw === undefined) return undefined;
  if (typeof raw !== 'number' || Number.isNaN(raw) || raw < min) {
    throw new InvalidParams(`${key} must be a number no less than ${min}`);
  }

  return raw;
}

function stringArg(args: Record<string, unknown>, key: string, required: boolean) {
  const raw = args[key];
  if (raw === undefined) {
    if (required) throw new InvalidParams(`${key} is required`);
    return undefined;
  }
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new InvalidParams(`${key} must be a non-empty string`);
  }

  return raw;
}

const ok = (structuredContent: unknown, isError?: true): ToolOutcome => ({
  content: [{ text: JSON.stringify(structuredContent), type: 'text' }],
  kind: 'ok',
  structuredContent,
  ...(isError === undefined ? {} : { isError }),
});

async function run(
  reader: McpReader,
  name: string,
  args: Record<string, unknown>
): Promise<ToolOutcome> {
  switch (name) {
    case 'recent_exceptions':
      return ok(await reader.recentExceptions(intArg(args, 'limit', 5, 50)));

    case 'recent_requests':
      return ok(
        await reader.recentRequests({
          limit: intArg(args, 'limit', 20, 100),
          minDuration: numberArg(args, 'minDuration', 0),
          minStatus: numberArg(args, 'minStatus', 0),
          status: numberArg(args, 'status', 0),
          uriContains: stringArg(args, 'uriContains', false),
        })
      );

    case 'request_detail': {
      const id = stringArg(args, 'id', true) as string;
      const detail = await reader.requestDetail(id);

      return detail === null
        ? ok({ error: `No incoming request recorded with id ${id}` }, true)
        : ok(detail);
    }

    case 'slow_queries':
      return ok(
        await reader.slowQueries({
          limit: intArg(args, 'limit', 10, 100),
          minMs: numberArg(args, 'minMs', 0) ?? 0,
        })
      );

    case 'stats':
      return ok(await reader.stats());

    default:
      throw new InvalidParams(`Unknown tool: ${name}`);
  }
}

export async function callTool(
  reader: McpReader,
  name: unknown,
  args: unknown
): Promise<ToolOutcome> {
  if (typeof name !== 'string') return { kind: 'invalidParams', message: 'name must be a string' };

  try {
    return await run(reader, name, record(args ?? {}));
  } catch (error) {
    if (error instanceof InvalidParams) return { kind: 'invalidParams', message: error.message };

    return ok({ error: error instanceof Error ? error.message : String(error) }, true);
  }
}
