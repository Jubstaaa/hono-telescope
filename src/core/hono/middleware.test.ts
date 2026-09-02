import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { describe, expect, it } from 'vitest';

import type { TelescopeConfig } from '../../types/index.js';
import { resolveConfig } from '../config.js';
import { alsContext } from '../context/als-context.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { createMiddleware } from './middleware.js';

function build(overrides: TelescopeConfig = {}) {
  const storage = memoryStorage();
  const config = resolveConfig({ context: alsContext(), storage, ...overrides });
  const recorder = new Recorder(config.storage, config.context);
  const app = new Hono();
  app.use('*', createMiddleware(recorder, config));

  return { app, config, recorder, storage };
}

const SETTLE_LIMIT_MS = 1000;

async function settleWithin(work: Promise<unknown>): Promise<'completed' | 'stalled'> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      work.then(() => 'completed' as const),
      new Promise<'stalled'>((resolve) => {
        timer = setTimeout(() => resolve('stalled'), SETTLE_LIMIT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

describe('createMiddleware', () => {
  it('records method, uri, status and duration', async () => {
    const { app, storage } = build();
    app.get('/hello', (c) => c.json({ ok: true }));

    await app.request('/hello');
    const [entry] = await storage.list('incoming_request');

    expect(entry).toMatchObject({ method: 'GET', response_status: 200, uri: '/hello' });
    expect(entry.response).toEqual({ ok: true });
    expect(typeof entry.duration).toBe('number');
  });

  it('records the request payload and leaves it readable by the handler', async () => {
    const { app, storage } = build();
    app.post('/echo', async (c) => c.json(await c.req.json()));

    const response = await app.request('/echo', {
      body: JSON.stringify({ name: 'ada' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(await response.json()).toEqual({ name: 'ada' });
    expect((await storage.list('incoming_request'))[0].payload).toEqual({ name: 'ada' });
  });

  it('redacts sensitive headers and body keys', async () => {
    const { app, storage } = build();
    app.post('/login', (c) => c.json({ ok: true }));

    await app.request('/login', {
      body: JSON.stringify({ password: 'hunter2' }),
      headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
      method: 'POST',
    });

    const [entry] = await storage.list('incoming_request');
    expect(entry.headers.authorization).toBe('[REDACTED]');
    expect(entry.payload.password).toBe('[REDACTED]');
  });

  it('records an exception and lets the app error handler run', async () => {
    const { app, storage } = build();
    app.get('/boom', () => {
      throw new Error('kaboom');
    });
    app.onError((error, c) => c.json({ handled: error.message }, 503));

    const response = await app.request('/boom');

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ handled: 'kaboom' });

    const [exception] = await storage.list('exception');
    expect(exception).toMatchObject({ message: 'kaboom' });
    expect(exception.parent_id).toBe((await storage.list('incoming_request'))[0].id);
    expect((await storage.list('incoming_request'))[0].response_status).toBe(503);
  });

  it('correlates child entries with the request', async () => {
    const { app, recorder, storage } = build();
    app.get('/work', async (c) => {
      await recorder.record('log', { level: 1, message: 'inside' });
      return c.json({ ok: true });
    });

    await app.request('/work');

    const [request] = await storage.list('incoming_request');
    expect(await storage.findByParent('log', request.id)).toHaveLength(1);
  });

  it('does not record the dashboard path', async () => {
    const { app, storage } = build({ dashboardPath: '/telescope' });
    app.get('/telescope/api/stats', (c) => c.json({}));

    await app.request('/telescope/api/stats');

    expect(await storage.count('incoming_request')).toBe(0);
  });

  it('skips static assets when ignoreStaticAssets is on', async () => {
    const { app, storage } = build();
    app.get('/app.css', (c) => c.text('body{}'));

    await app.request('/app.css');

    expect(await storage.count('incoming_request')).toBe(0);
  });

  it('ignores the default `.well-known` prefix', async () => {
    const { app, storage } = build();
    app.get('/.well-known/acme-challenge/:token', (c) => c.text('ok'));

    await app.request('/.well-known/acme-challenge/abc');

    expect(await storage.count('incoming_request')).toBe(0);
  });

  it('records a static asset path when the option is off', async () => {
    const { app, storage } = build({ ignoreStaticAssets: false });
    app.get('/app.css', (c) => c.text('body{}'));

    await app.request('/app.css');

    expect(await storage.count('incoming_request')).toBe(1);
  });

  it('does not read a streaming response', async () => {
    const { app, storage } = build();
    app.get(
      '/stream',
      () => new Response('data: 1\n\n', { headers: { 'content-type': 'text/event-stream' } })
    );

    const response = await app.request('/stream');

    expect(await response.text()).toBe('data: 1\n\n');
    expect((await storage.list('incoming_request'))[0].response).toEqual({});
  });

  it('releases a streamText response before the stream finishes', async () => {
    const { app, storage } = build();
    app.get('/tokens', (c) =>
      streamText(c, async (stream) => {
        for (const token of ['alpha ', 'beta ', 'gamma']) {
          await stream.write(token);
          await stream.sleep(200);
        }
      })
    );

    const startTime = Date.now();
    const response = await app.request('/tokens');
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(100);
    expect(await response.text()).toBe('alpha beta gamma');

    const [entry] = await storage.list('incoming_request');
    expect(entry.response).toEqual({});
    expect(JSON.stringify(entry.response)).not.toContain('alpha');
  });

  it('redacts sensitive keys in the recorded response body', async () => {
    const { app, storage } = build();
    app.post('/login', (c) =>
      c.json({ token: 'eyJhbGciOi.SECRET', user: { password: 'hunter2' } })
    );

    await app.request('/login', { method: 'POST' });

    expect((await storage.list('incoming_request'))[0].response).toEqual({
      token: '[REDACTED]',
      user: { password: '[REDACTED]' },
    });
  });

  it('caps a chunked request body that declares no content-length', async () => {
    const { app, storage } = build({ capture: { maxBodySize: 100 } });
    app.post('/bulk', (c) => c.json({ ok: true }));

    const body = JSON.stringify({ data: 'x'.repeat(4096) });
    await app.request('/bulk', {
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        },
      }),
      // @ts-expect-error duplex is required by Node for a streamed request body
      duplex: 'half',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    const [entry] = await storage.list('incoming_request');
    expect(entry.payload).toMatchObject({ truncated: true });
    expect(JSON.stringify(entry.payload).length).toBeLessThan(200);
  });

  it('records a text body under `body` and leaves it readable by the handler', async () => {
    const { app, storage } = build();
    app.post('/notes', async (c) => c.text(await c.req.text()));

    const response = await app.request('/notes', {
      body: 'plain note',
      headers: { 'content-type': 'text/plain' },
      method: 'POST',
    });

    expect(await response.text()).toBe('plain note');
    expect((await storage.list('incoming_request'))[0].payload).toEqual({ body: 'plain note' });
  });

  it('leaves a JSON body readable by the handler through both text() and json()', async () => {
    const { app, storage } = build();
    app.post('/echo', async (c) => {
      const text = await c.req.text();
      const json = await c.req.json();

      return c.json({ json, text });
    });

    const response = await app.request('/echo', {
      body: JSON.stringify({ name: 'ada' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(await response.json()).toEqual({
      json: { name: 'ada' },
      text: '{"name":"ada"}',
    });
    expect((await storage.list('incoming_request'))[0].payload).toEqual({ name: 'ada' });
  });

  it('wraps a JSON array request body under `body` and still redacts inside it', async () => {
    const { app, storage } = build();
    app.post('/bulk', (c) => c.json({ ok: true }));

    await app.request('/bulk', {
      body: JSON.stringify([{ password: 'hunter2' }, { name: 'ada' }]),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect((await storage.list('incoming_request'))[0].payload).toEqual({
      body: [{ password: '[REDACTED]' }, { name: 'ada' }],
    });
  });

  it('wraps a JSON array response body under `response`', async () => {
    const { app, storage } = build();
    app.get('/list', (c) => c.json([1, 2, 3]));

    await app.request('/list');

    expect((await storage.list('incoming_request'))[0].response).toEqual({ response: [1, 2, 3] });
  });

  it('records an empty payload for a bodyless JSON POST', async () => {
    const { app, storage } = build();
    app.post('/empty', (c) => c.json({ ok: true }));

    await app.request('/empty', {
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect((await storage.list('incoming_request'))[0].payload).toEqual({});
  });

  it('records an empty payload for a GET carrying a JSON content-type', async () => {
    const { app, storage } = build();
    app.get('/nobody', (c) => c.json({ ok: true }));

    await app.request('/nobody', {
      headers: { 'content-type': 'application/json' },
      method: 'GET',
    });

    expect((await storage.list('incoming_request'))[0].payload).toEqual({});
  });

  it('completes an oversize json response and records only its metadata', async () => {
    const { app, storage } = build({ capture: { maxBodySize: 50 } });
    const payload = { data: 'x'.repeat(500) };
    app.get('/big', (c) => c.json(payload));

    const request = Promise.resolve(app.request('/big'));
    expect(await settleWithin(request)).toBe('completed');

    expect(await (await request).json()).toEqual(payload);
    expect((await storage.list('incoming_request'))[0].response).toEqual({
      size: 50,
      truncated: true,
    });
  });

  it('completes an oversize text response and records only its metadata', async () => {
    const { app, storage } = build({ capture: { maxBodySize: 50 } });
    const body = 'y'.repeat(500);
    app.get('/big-text', (c) => c.text(body));

    const request = Promise.resolve(app.request('/big-text'));
    expect(await settleWithin(request)).toBe('completed');

    expect(await (await request).text()).toBe(body);
    expect((await storage.list('incoming_request'))[0].response).toEqual({
      size: 50,
      truncated: true,
    });
  });
});
