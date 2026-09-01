import { afterEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
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

  telescope = createTelescope({ storage, enabled: true });

  const db = {
    query: (sql: string) => ({
      sql,
      all: (...bindings: unknown[]) => [{ id: bindings[0] ?? 1 }],
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
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer live-key' },
      body: JSON.stringify({ password: 'hunter2' }),
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
        queries: { query: string }[];
        outgoing_requests: { uri: string }[];
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
