import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { TelescopeConfig } from '../../types/index.js';
import { resolveConfig } from '../config.js';
import { alsContext } from '../context/als-context.js';
import { createDashboard } from '../hono/dashboard.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { RPC_ERRORS, SUPPORTED_PROTOCOL_VERSIONS } from './protocol.js';

function build(overrides: TelescopeConfig = {}) {
  const storage = memoryStorage();
  const config = resolveConfig({ context: alsContext(), enabled: true, storage, ...overrides });
  const recorder = new Recorder(config.storage, config.context);
  const app = new Hono();
  app.route(config.dashboardPath, createDashboard(recorder, config));

  return { app, recorder };
}

const rpc = (app: Hono, body: unknown, headers: Record<string, string> = {}) =>
  app.request('/telescope/mcp', {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
    method: 'POST',
  });

describe('mcp routes', () => {
  it('answers GET and DELETE with 405 instead of the dashboard html', async () => {
    const { app } = build();

    const get = await app.request('/telescope/mcp');
    const del = await app.request('/telescope/mcp', { method: 'DELETE' });

    expect(get.status).toBe(405);
    expect(del.status).toBe(405);
    expect(await get.text()).not.toContain('__TELESCOPE_BASE__');
  });

  it('lists the tools', async () => {
    const { app } = build();

    const body = await (await rpc(app, { id: 1, jsonrpc: '2.0', method: 'tools/list' })).json();

    expect(body).toMatchObject({ id: 1, jsonrpc: '2.0', result: { resultType: 'complete' } });
    expect((body as { result: { tools: unknown[] } }).result.tools).toHaveLength(5);
  });

  it('initializes for an older client', async () => {
    const { app } = build();

    const response = await rpc(app, {
      id: 1,
      jsonrpc: '2.0',
      method: 'initialize',
      params: { protocolVersion: '2025-11-25' },
    });

    expect(await response.json()).toMatchObject({
      result: {
        capabilities: { tools: {} },
        protocolVersion: '2025-11-25',
        serverInfo: { name: 'hono-telescope' },
      },
    });
  });

  it('calls a tool without any prior initialize, 2026-07-28 style', async () => {
    const { app, recorder } = build();
    await recorder.record('log', { level: 1, message: 'hello' });

    const response = await rpc(
      app,
      {
        id: 2,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' },
          arguments: {},
          name: 'stats',
        },
      },
      { 'MCP-Protocol-Version': '2026-07-28' }
    );

    expect(await response.json()).toMatchObject({
      id: 2,
      result: { resultType: 'complete', structuredContent: { logs: { total: 1 } } },
    });
  });

  it('answers a ping', async () => {
    const { app } = build();

    expect(await (await rpc(app, { id: 3, jsonrpc: '2.0', method: 'ping' })).json()).toMatchObject({
      id: 3,
      result: {},
    });
  });

  it('accepts a notification with 202 and no body', async () => {
    const { app } = build();

    const response = await rpc(app, { jsonrpc: '2.0', method: 'notifications/initialized' });

    expect(response.status).toBe(202);
    expect(await response.text()).toBe('');
  });

  it('reports a parse error for an unparseable body', async () => {
    const { app } = build();

    const response = await app.request('/telescope/mcp', {
      body: '{ not json',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(await response.json()).toMatchObject({
      error: { code: RPC_ERRORS.parse },
      id: null,
    });
  });

  it('rejects an unsupported protocol version with the supported list', async () => {
    const { app } = build();

    const response = await rpc(app, {
      id: 4,
      jsonrpc: '2.0',
      method: 'tools/list',
      params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '1900-01-01' } },
    });

    expect(await response.json()).toMatchObject({
      error: {
        code: RPC_ERRORS.unsupportedProtocolVersion,
        data: { requested: '1900-01-01', supported: [...SUPPORTED_PROTOCOL_VERSIONS] },
      },
    });
  });

  it('rejects an unknown method and an unknown tool differently', async () => {
    const { app } = build();

    const method = await (
      await rpc(app, { id: 5, jsonrpc: '2.0', method: 'resources/list' })
    ).json();
    const tool = await (
      await rpc(app, { id: 6, jsonrpc: '2.0', method: 'tools/call', params: { name: 'nope' } })
    ).json();

    expect(method).toMatchObject({ error: { code: RPC_ERRORS.methodNotFound } });
    expect(tool).toMatchObject({ error: { code: RPC_ERRORS.invalidParams } });
  });

  it('is covered by the dashboard basic auth', async () => {
    const { app } = build({ dashboard: { auth: { password: 'p', username: 'u' } } });

    const anonymous = await rpc(app, { id: 7, jsonrpc: '2.0', method: 'tools/list' });
    const authorized = await rpc(
      app,
      { id: 8, jsonrpc: '2.0', method: 'tools/list' },
      {
        authorization: `Basic ${btoa('u:p')}`,
      }
    );

    expect(anonymous.status).toBe(401);
    expect(authorized.status).toBe(200);
  });
});
