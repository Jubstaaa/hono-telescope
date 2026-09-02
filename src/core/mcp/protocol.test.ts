import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TELESCOPE_VERSION } from '../constants.js';
import {
  RPC_ERRORS,
  SUPPORTED_PROTOCOL_VERSIONS,
  negotiate,
  parseRpc,
  requestedVersion,
  rpcError,
  rpcResult,
} from './protocol.js';

describe('parseRpc', () => {
  it('parses a well-formed call', () => {
    const parsed = parseRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { a: 1 } });

    expect(parsed).toEqual({
      kind: 'call',
      call: { id: 1, method: 'tools/list', params: { a: 1 } },
    });
  });

  it('defaults missing params to an empty object', () => {
    const parsed = parseRpc({ jsonrpc: '2.0', id: 'x', method: 'ping' });

    expect(parsed).toEqual({ kind: 'call', call: { id: 'x', method: 'ping', params: {} } });
  });

  it('treats a call without an id as a notification', () => {
    expect(parseRpc({ jsonrpc: '2.0', method: 'notifications/initialized' })).toEqual({
      kind: 'notification',
      method: 'notifications/initialized',
    });
  });

  it('rejects a batch', () => {
    const parsed = parseRpc([{ jsonrpc: '2.0', id: 1, method: 'ping' }]);

    expect(parsed).toMatchObject({ kind: 'invalid', code: RPC_ERRORS.invalidRequest });
  });

  it.each([
    ['a non-object body', 'nope'],
    ['a wrong jsonrpc version', { jsonrpc: '1.0', id: 1, method: 'ping' }],
    ['a missing method', { jsonrpc: '2.0', id: 1 }],
    ['a non-string method', { jsonrpc: '2.0', id: 1, method: 7 }],
    ['a boolean id', { jsonrpc: '2.0', id: true, method: 'ping' }],
  ])('rejects %s', (_label, body) => {
    expect(parseRpc(body)).toMatchObject({ kind: 'invalid', code: RPC_ERRORS.invalidRequest });
  });
});

describe('requestedVersion', () => {
  const call = (params: Record<string, unknown>) => ({ id: 1, method: 'tools/call', params });

  it('reads the 2026-07-28 _meta key', () => {
    const version = requestedVersion(
      call({ _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' } }),
      undefined
    );

    expect(version).toBe('2026-07-28');
  });

  it('reads protocolVersion from initialize params', () => {
    expect(requestedVersion(call({ protocolVersion: '2025-11-25' }), undefined)).toBe('2025-11-25');
  });

  it('falls back to the header', () => {
    expect(requestedVersion(call({}), '2025-11-25')).toBe('2025-11-25');
  });

  it('is undefined when nothing declares a version', () => {
    expect(requestedVersion(call({}), undefined)).toBeUndefined();
  });
});

describe('negotiate', () => {
  it('assumes the newest supported version when none is declared', () => {
    expect(negotiate(undefined)).toEqual({ ok: true, version: SUPPORTED_PROTOCOL_VERSIONS[0] });
  });

  it('accepts every supported version', () => {
    for (const version of SUPPORTED_PROTOCOL_VERSIONS) {
      expect(negotiate(version)).toEqual({ ok: true, version });
    }
  });

  it('rejects an unsupported version', () => {
    expect(negotiate('1900-01-01')).toEqual({ ok: false, requested: '1900-01-01' });
  });
});

describe('response builders', () => {
  it('builds a result', () => {
    expect(rpcResult(1, { ok: true })).toEqual({ jsonrpc: '2.0', id: 1, result: { ok: true } });
  });

  it('builds an error without a data key when data is omitted', () => {
    expect(rpcError(1, RPC_ERRORS.methodNotFound, 'Method not found')).toEqual({
      jsonrpc: '2.0',
      id: 1,
      error: { code: RPC_ERRORS.methodNotFound, message: 'Method not found' },
    });
  });

  it('carries data when given', () => {
    const response = rpcError(null, RPC_ERRORS.unsupportedProtocolVersion, 'Unsupported', {
      supported: SUPPORTED_PROTOCOL_VERSIONS,
      requested: '1900-01-01',
    });

    expect(response).toMatchObject({
      id: null,
      error: { data: { requested: '1900-01-01' } },
    });
  });
});

describe('TELESCOPE_VERSION', () => {
  it('matches the published package version', () => {
    // Read, not imported: importing package.json makes it a TypeScript program input, which
    // moves tsc's inferred root directory up and emits the whole tree under `dist/src/`.
    const pkg = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8')
    ) as { version: string };

    expect(TELESCOPE_VERSION).toBe(pkg.version);
  });
});
