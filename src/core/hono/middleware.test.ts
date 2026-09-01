import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createMiddleware } from './middleware';
import { Recorder } from '../recorder';
import { memoryStorage } from '../storage/memory-storage';
import { alsContext } from '../context/als-context';
import { resolveConfig } from '../config';
import type { TelescopeConfig } from '@/types';

function build(overrides: TelescopeConfig = {}) {
  const storage = memoryStorage();
  const config = resolveConfig({ storage, context: alsContext(), ...overrides });
  const recorder = new Recorder(config.storage, config.context);
  const app = new Hono();
  app.use('*', createMiddleware(recorder, config));

  return { app, storage, recorder, config };
}

describe('createMiddleware', () => {
  it('records method, uri, status and duration', async () => {
    const { app, storage } = build();
    app.get('/hello', (c) => c.json({ ok: true }));

    await app.request('/hello');
    const [entry] = await storage.list('incoming_request');

    expect(entry).toMatchObject({ method: 'GET', uri: '/hello', response_status: 200 });
    expect(entry.response).toEqual({ ok: true });
    expect(typeof entry.duration).toBe('number');
  });

  it('records the request payload and leaves it readable by the handler', async () => {
    const { app, storage } = build();
    app.post('/echo', async (c) => c.json(await c.req.json()));

    const response = await app.request('/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'ada' }),
    });

    expect(await response.json()).toEqual({ name: 'ada' });
    expect((await storage.list('incoming_request'))[0].payload).toEqual({ name: 'ada' });
  });

  it('redacts sensitive headers and body keys', async () => {
    const { app, storage } = build();
    app.post('/login', (c) => c.json({ ok: true }));

    await app.request('/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer secret' },
      body: JSON.stringify({ password: 'hunter2' }),
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
    const { app, storage, recorder } = build();
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
});
