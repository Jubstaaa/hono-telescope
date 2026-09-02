import type { McpReader } from './reader.js';

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export type ToolOutcome =
  | {
      kind: 'ok';
      content: [{ type: 'text'; text: string }];
      structuredContent: unknown;
      isError?: true;
    }
  | { kind: 'invalidParams'; message: string };

const limitSchema = (max: number, fallback: number) => ({
  type: 'integer',
  minimum: 1,
  maximum: max,
  default: fallback,
});

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: 'recent_exceptions',
    title: 'Recent exceptions',
    description:
      "The most recent exceptions, each with the request that produced it and that request's logs, queries and outgoing calls. Start here when something failed.",
    inputSchema: {
      type: 'object',
      properties: { limit: limitSchema(50, 5) },
      additionalProperties: false,
    },
  },
  {
    name: 'recent_requests',
    title: 'Recent requests',
    description:
      'Recent incoming requests with child counts. Filter with minStatus: 400 to find failures that returned an error status without throwing.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: limitSchema(100, 20),
        status: { type: 'integer', description: 'Exact response status' },
        minStatus: { type: 'integer', description: 'Inclusive lower bound on response status' },
        minDuration: { type: 'number', description: 'Minimum duration in milliseconds' },
        uriContains: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'request_detail',
    title: 'Request detail',
    description:
      'One request in full — headers, payload, response body — with every log, query, exception and outgoing call recorded inside it. Nothing is truncated.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'slow_queries',
    title: 'Slow queries',
    description: 'Recent database queries sorted slowest first, each with the request it ran in.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: limitSchema(100, 10),
        minMs: { type: 'number', minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'stats',
    title: 'Telemetry counts',
    description: 'How many entries of each type have been recorded.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
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
  kind: 'ok',
  content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
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
          status: numberArg(args, 'status', 0),
          minStatus: numberArg(args, 'minStatus', 0),
          minDuration: numberArg(args, 'minDuration', 0),
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
