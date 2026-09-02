import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { resolveConfig } from '../core/config.js';
import { alsContext } from '../core/context/als-context.js';
import { createDashboard } from '../core/hono/dashboard.js';
import { RPC_ERRORS } from '../core/mcp/protocol.js';
import { Recorder } from '../core/recorder.js';
import { memoryStorage } from '../core/storage/memory-storage.js';
import type { TelescopeConfig } from '../types/index.js';

import { type PostResult, runStdioBridge } from './stdio-bridge.js';

async function* chunks(...values: (string | Uint8Array)[]): AsyncGenerator<string | Uint8Array> {
  for (const value of values) yield value;
}

function collect() {
  const lines: string[] = [];

  return { lines, writeLine: (line: string) => lines.push(line) };
}

const silenceStderr = () => vi.spyOn(console, 'error').mockImplementation(() => {});

const ok = (body: string): Promise<PostResult> => Promise.resolve({ body, status: 200 });

const call = (id: number, method = 'ping') =>
  JSON.stringify({ id, jsonrpc: '2.0', method, params: {} });

const answer = (id: number) => JSON.stringify({ id, jsonrpc: '2.0', result: {} });

function buildApp(overrides: TelescopeConfig = {}) {
  const config = resolveConfig({
    context: alsContext(),
    enabled: true,
    storage: memoryStorage(),
    ...overrides,
  });
  const app = new Hono();
  app.route(
    config.dashboardPath,
    createDashboard(new Recorder(config.storage, config.context), config)
  );

  return app;
}

describe('runStdioBridge', () => {
  it('forwards a line verbatim and writes the response as one line', async () => {
    const posted: string[] = [];
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(1)}\n`),
      post: (body) => {
        posted.push(body);

        return ok(answer(1));
      },
      writeLine,
    });

    expect(posted).toEqual([call(1)]);
    expect(lines).toEqual([answer(1)]);
  });

  it('writes nothing for a notification the endpoint accepts with 202', async () => {
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`),
      post: () => Promise.resolve({ body: '', status: 202 }),
      writeLine,
    });

    expect(lines).toEqual([]);
  });

  it('reassembles a line split across chunks', async () => {
    const posted: string[] = [];
    const { lines, writeLine } = collect();
    const line = call(1);

    await runStdioBridge({
      input: chunks(line.slice(0, 10), line.slice(10), '\n'),
      post: (body) => {
        posted.push(body);

        return ok(answer(1));
      },
      writeLine,
    });

    expect(posted).toEqual([line]);
    expect(lines).toHaveLength(1);
  });

  it('accepts byte chunks, crlf endings and blank lines', async () => {
    const posted: string[] = [];
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(new TextEncoder().encode(`${call(1)}\r\n\n   \n${call(2)}\r\n`)),
      post: (body) => {
        posted.push(body);

        return ok(answer(JSON.parse(body).id as number));
      },
      writeLine,
    });

    expect(posted).toEqual([call(1), call(2)]);
    expect(lines).toHaveLength(2);
  });

  it('handles a last line that has no trailing newline', async () => {
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(call(1)),
      post: () => ok(answer(1)),
      writeLine,
    });

    expect(lines).toEqual([answer(1)]);
  });

  it('writes each response as it resolves instead of blocking behind a slow one', async () => {
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(1)}\n${call(2)}\n`),
      post: (body) => {
        const id = (JSON.parse(body) as { id: number }).id;

        return new Promise<PostResult>((resolve) =>
          setTimeout(() => resolve({ body: answer(id), status: 200 }), id === 1 ? 20 : 0)
        );
      },
      writeLine,
    });

    expect(lines).toEqual([answer(2), answer(1)]);
  });

  it('collapses a pretty-printed response body onto a single line', async () => {
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(1)}\n`),
      post: () => ok('{\n  "id": 1,\n  "jsonrpc": "2.0",\n  "result": {}\n}'),
      writeLine,
    });

    expect(lines).toEqual([answer(1)]);
  });

  it('answers a transport failure with a json-rpc error carrying the same id', async () => {
    const stderr = silenceStderr();
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(9)}\n`),
      post: () => Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:3000')),
      writeLine,
    });

    expect(JSON.parse(lines[0])).toMatchObject({
      error: { code: RPC_ERRORS.internal },
      id: 9,
      jsonrpc: '2.0',
    });
    expect(lines[0]).toContain('ECONNREFUSED');
    expect(stderr).toHaveBeenCalled();
  });

  it('reports a failed notification on stderr only, since it has no response', async () => {
    const stderr = silenceStderr();
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/cancelled' })}\n`),
      post: () => Promise.reject(new Error('socket hang up')),
      writeLine,
    });

    expect(lines).toEqual([]);
    expect(stderr).toHaveBeenCalled();
  });

  it('keeps a dashboard html page out of stdout when the url points at the wrong path', async () => {
    silenceStderr();
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(3)}\n`),
      post: () => Promise.resolve({ body: '<!doctype html><title>Telescope</title>', status: 404 }),
      writeLine,
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('<!doctype');
    expect(JSON.parse(lines[0])).toMatchObject({ error: { code: RPC_ERRORS.internal }, id: 3 });
    expect(lines[0]).toContain('404');
    expect(lines[0]).toContain('--url');
  });

  it('names the likely cause when the endpoint answers a plain-text 404', async () => {
    silenceStderr();
    const { lines, writeLine } = collect();

    // Hono answers a POST to the dashboard root with a plain-text 404, not with the SPA html,
    // so the hint cannot key off the body shape alone.
    await runStdioBridge({
      input: chunks(`${call(3)}\n`),
      post: () => Promise.resolve({ body: '404 Not Found', status: 404 }),
      writeLine,
    });

    expect(lines[0]).toContain('404');
    expect(lines[0]).toContain('--url');
  });

  it('reports a 2xx body that is not json', async () => {
    silenceStderr();
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(4)}\n`),
      post: () => ok('OK'),
      writeLine,
    });

    expect(JSON.parse(lines[0])).toMatchObject({ error: { code: RPC_ERRORS.internal }, id: 4 });
  });

  it('truncates a long failure body instead of flooding the client', async () => {
    silenceStderr();
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(5)}\n`),
      post: () => Promise.resolve({ body: 'x'.repeat(5000), status: 500 }),
      writeLine,
    });

    expect(lines[0].length).toBeLessThan(500);
  });

  it('forwards an unparseable line and relays the parse error the endpoint returns', async () => {
    const posted: string[] = [];
    const { lines, writeLine } = collect();
    const parseError = JSON.stringify({
      error: { code: RPC_ERRORS.parse, message: 'Parse error' },
      id: null,
      jsonrpc: '2.0',
    });

    await runStdioBridge({
      input: chunks('{ not json\n'),
      post: (body) => {
        posted.push(body);

        return ok(parseError);
      },
      writeLine,
    });

    expect(posted).toEqual(['{ not json']);
    expect(lines).toEqual([parseError]);
  });

  it('waits for in-flight requests before it returns', async () => {
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(`${call(1)}\n`),
      post: () =>
        new Promise<PostResult>((resolve) =>
          setTimeout(() => resolve({ body: answer(1), status: 200 }), 15)
        ),
      writeLine,
    });

    expect(lines).toEqual([answer(1)]);
  });

  it('drives the real mcp endpoint end to end', async () => {
    const app = buildApp();
    const { lines, writeLine } = collect();

    await runStdioBridge({
      input: chunks(
        `${JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'initialize', params: {} })}\n`,
        `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
        `${JSON.stringify({ id: 2, jsonrpc: '2.0', method: 'tools/list' })}\n`
      ),
      post: async (body) => {
        const response = await app.request('/telescope/mcp', {
          body,
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        });

        return { body: await response.text(), status: response.status };
      },
      writeLine,
    });

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toMatchObject({
      id: 1,
      result: { protocolVersion: '2026-07-28', serverInfo: { name: 'hono-telescope' } },
    });
    expect((JSON.parse(lines[1]) as { result: { tools: unknown[] } }).result.tools).toHaveLength(5);
  });

  it('reaches an endpoint that requires basic auth when the header is supplied', async () => {
    const app = buildApp({ dashboard: { auth: { password: 'p', username: 'u' } } });
    const { lines, writeLine } = collect();
    const headers = { authorization: `Basic ${Buffer.from('u:p').toString('base64')}` };

    await runStdioBridge({
      input: chunks(`${call(1, 'tools/list')}\n`),
      post: async (body) => {
        const response = await app.request('/telescope/mcp', {
          body,
          headers: { 'content-type': 'application/json', ...headers },
          method: 'POST',
        });

        return { body: await response.text(), status: response.status };
      },
      writeLine,
    });

    expect(JSON.parse(lines[0])).toMatchObject({ id: 1, jsonrpc: '2.0' });
    expect(lines[0]).toContain('recent_exceptions');
  });
});
