import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { afterEach, describe, expect, it } from 'vitest';

import { createTelescope, memoryStorage } from './index.js';
import type { Telescope } from './index.js';

const originalFetch = globalThis.fetch;
let telescope: Telescope | undefined;

afterEach(() => {
  telescope?.stop();
  telescope = undefined;
  globalThis.fetch = originalFetch;
});

function build() {
  const storage = memoryStorage();
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ token: 'upstream-secret' }), {
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;

  telescope = createTelescope({ enabled: true, storage });

  const db = {
    query: (sql: string) => ({
      all: (...bindings: unknown[]) => [{ id: bindings[0] ?? 1 }],
      sql,
    }),
  };
  const instrumented = telescope.instrumentBunSqlite(db);

  const app = new Hono();
  app.use('*', telescope.middleware());
  app.route('/telescope', telescope.dashboard());

  app.post('/orders', async (c) => {
    const body = await c.req.json<{ password: string }>();
    console.log('creating order for', body.password === undefined ? 'anon' : 'user');
    instrumented.query('SELECT * FROM orders WHERE id = ?').all(7);
    const upstream = await fetch('https://payments.test/charge');

    return c.json({ charged: (await upstream.json()) as unknown });
  });

  app.get('/tokens', (c) =>
    streamText(c, async (stream) => {
      for (const token of ['one ', 'two ', 'three']) {
        await stream.write(token);
        await stream.sleep(200);
      }
    })
  );

  return { app, storage };
}

describe('hono-telescope end to end', () => {
  it('assembles a request with its log, query and outgoing request', async () => {
    const { app, storage } = build();

    const response = await app.request('/orders', {
      body: JSON.stringify({ password: 'hunter2' }),
      headers: { authorization: 'Bearer live-key', 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(200);

    const [request] = await storage.list('incoming_request');
    expect(request.headers.authorization).toBe('[REDACTED]');
    expect(request.payload).toEqual({ password: '[REDACTED]' });
    expect(request.response).toEqual({ charged: { token: '[REDACTED]' } });

    const detail = await app.request(`/telescope/api/incoming-requests/${request.id}`);
    const body = (await detail.json()) as {
      relation_entries: {
        logs: unknown[];
        outgoing_requests: { uri: string }[];
        queries: { query: string }[];
      };
    };

    expect(body.relation_entries.logs).toHaveLength(1);
    expect(body.relation_entries.queries[0].query).toContain('SELECT * FROM orders');
    expect(body.relation_entries.outgoing_requests[0].uri).toBe('https://payments.test/charge');
  });

  it('does not delay or record a streamed response', async () => {
    const { app, storage } = build();

    const startTime = Date.now();
    const response = await app.request('/tokens');
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(100);
    expect(await response.text()).toBe('one two three');

    const [request] = await storage.list('incoming_request');
    expect(request.uri).toBe('/tokens');
    expect(JSON.stringify(request.response)).not.toContain('one');
  });
});

describe('mcp endpoint', () => {
  const mcp = (app: Hono, body: unknown) =>
    app.request('/telescope/mcp', {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

  const callTool = async (app: Hono, name: string, args: Record<string, unknown> = {}) => {
    const response = await mcp(app, {
      id: 1,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: args, name },
    });
    const body = (await response.json()) as { result: { structuredContent: unknown } };

    return body.result.structuredContent;
  };

  it('explains a failed request through recent_exceptions', async () => {
    const { app } = build();
    app.get('/boom', () => {
      console.log('about to fail');
      throw new Error('kaboom');
    });
    app.onError((_error, c) => c.json({ error: 'internal' }, 500));

    await app.request('/boom');

    const result = (await callTool(app, 'recent_exceptions')) as {
      exceptions: { message: string; request: { response_status: number; uri: string } }[];
    };

    expect(result.exceptions[0]).toMatchObject({
      message: 'kaboom',
      request: { response_status: 500, uri: '/boom' },
    });
  });

  it('finds an error status that never threw, via minStatus', async () => {
    const { app } = build();
    app.get('/missing', (c) => c.json({ error: 'nope' }, 404));

    await app.request('/missing');

    const result = (await callTool(app, 'recent_requests', { minStatus: 400 })) as {
      requests: { response_status: number; uri: string }[];
    };

    expect(result.requests).toMatchObject([{ response_status: 404, uri: '/missing' }]);
  });

  it('assembles the whole request tree that the collectors recorded', async () => {
    const { app } = build();

    await app.request('/orders', {
      body: JSON.stringify({ password: 'hunter2' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    const listed = (await callTool(app, 'recent_requests')) as { requests: { id: string }[] };
    const detail = (await callTool(app, 'request_detail', { id: listed.requests[0].id })) as {
      request: {
        logs: unknown[];
        outgoing: unknown[];
        payload: Record<string, unknown>;
        queries: unknown[];
        uri: string;
      };
    };

    expect(detail.request.uri).toBe('/orders');
    expect(detail.request.payload).toMatchObject({ password: '[REDACTED]' });
    expect(detail.request.logs).toHaveLength(1);
    expect(detail.request.queries).toHaveLength(1);
    expect(detail.request.outgoing).toHaveLength(1);
  });

  it('does not record its own traffic', async () => {
    const { app } = build();
    await app.request('/orders', {
      body: JSON.stringify({ password: 'x' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    const before = (await callTool(app, 'stats')) as { incomingRequests: { total: number } };
    await callTool(app, 'stats');
    const after = (await callTool(app, 'stats')) as { incomingRequests: { total: number } };

    expect(after.incomingRequests.total).toBe(before.incomingRequests.total);
  });
});
