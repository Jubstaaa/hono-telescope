export const SUPPORTED_PROTOCOL_VERSIONS = ['2026-07-28', '2025-11-25'] as const;

export const RPC_ERRORS = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  unsupportedProtocolVersion: -32022,
} as const;

type SupportedVersion = (typeof SUPPORTED_PROTOCOL_VERSIONS)[number];

const META_VERSION_KEY = 'io.modelcontextprotocol/protocolVersion';

export interface RpcCall {
  id: string | number;
  method: string;
  params: Record<string, unknown>;
}

export type ParsedRpc =
  | { kind: 'call'; call: RpcCall }
  | { kind: 'notification'; method: string }
  | { kind: 'invalid'; code: number; message: string };

const invalid = (message: string): ParsedRpc => ({
  kind: 'invalid',
  code: RPC_ERRORS.invalidRequest,
  message,
});

export function parseRpc(body: unknown): ParsedRpc {
  if (Array.isArray(body)) return invalid('Batch requests are not supported');
  if (typeof body !== 'object' || body === null) return invalid('Request must be a JSON object');

  const { jsonrpc, method, id, params } = body as Record<string, unknown>;

  if (jsonrpc !== '2.0') return invalid('jsonrpc must be "2.0"');
  if (typeof method !== 'string' || method.length === 0) return invalid('method must be a string');

  const resolvedParams =
    typeof params === 'object' && params !== null && !Array.isArray(params)
      ? (params as Record<string, unknown>)
      : {};

  if (id === undefined || id === null) return { kind: 'notification', method };
  if (typeof id !== 'string' && typeof id !== 'number') {
    return invalid('id must be a string or a number');
  }

  return { kind: 'call', call: { id, method, params: resolvedParams } };
}

export function requestedVersion(call: RpcCall, header: string | undefined): string | undefined {
  const meta = call.params._meta;
  const fromMeta =
    typeof meta === 'object' && meta !== null
      ? (meta as Record<string, unknown>)[META_VERSION_KEY]
      : undefined;
  const candidate = fromMeta ?? call.params.protocolVersion ?? header;

  return typeof candidate === 'string' ? candidate : undefined;
}

export function negotiate(
  requested: string | undefined
): { ok: true; version: string } | { ok: false; requested: string } {
  if (requested === undefined) return { ok: true, version: SUPPORTED_PROTOCOL_VERSIONS[0] };

  return SUPPORTED_PROTOCOL_VERSIONS.includes(requested as SupportedVersion)
    ? { ok: true, version: requested }
    : { ok: false, requested };
}

export const rpcResult = (id: string | number, result: unknown) => ({
  jsonrpc: '2.0' as const,
  id,
  result,
});

export const rpcError = (
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
) => ({
  jsonrpc: '2.0' as const,
  id,
  error: { code, message, ...(data === undefined ? {} : { data }) },
});
