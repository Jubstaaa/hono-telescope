import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TelescopeConfig } from '../../types/index.js';
import { resolveConfig } from '../config.js';
import { alsContext } from '../context/als-context.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { createDashboard } from './dashboard.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

function build(overrides: TelescopeConfig = {}) {
  const storage = memoryStorage();
  const config = resolveConfig({ context: alsContext(), enabled: true, storage, ...overrides });
  const recorder = new Recorder(config.storage, config.context);
  const app = new Hono();
  app.route(config.dashboardPath, createDashboard(recorder, config));

  return { app, config, recorder };
}

describe('createDashboard', () => {
  it('serves the SPA html with the base path injected', async () => {
    const { app } = build({ dashboardPath: '/debug' });

    const response = await app.request('/debug');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('__TELESCOPE_BASE__');
    expect(html).toContain('/debug');
  });

  it('serves the SPA html for a nested client route', async () => {
    const { app } = build();

    expect((await app.request('/telescope/logs/123')).status).toBe(200);
  });

  it('returns stats', async () => {
    const { app, recorder } = build();
    await recorder.record('log', { level: 1, message: 'x' });

    const response = await app.request('/telescope/api/stats');

    expect(await response.json()).toMatchObject({ logs: { total: 1 } });
  });

  it('lists a resource newest first', async () => {
    const { app, recorder } = build();
    await recorder.record('log', { level: 1, message: 'first' });
    await recorder.record('log', { level: 1, message: 'second' });

    const body = (await (await app.request('/telescope/api/logs')).json()) as {
      message: string;
    }[];

    expect(body.map((entry) => entry.message)).toEqual(['second', 'first']);
  });

  it('returns a detail entry with its relations', async () => {
    const { app, recorder } = build();
    const requestId = await recorder.record(
      'incoming_request',
      {
        duration: 1,
        headers: {},
        method: 'GET',
        payload: {},
        response: {},
        response_headers: {},
        response_status: 200,
        uri: '/x',
      },
      'req-1'
    );
    await recorder.record('log', { level: 1, message: 'child', parent_id: requestId });

    const body = (await (await app.request('/telescope/api/incoming-requests/req-1')).json()) as {
      relation_entries: { logs: unknown[] };
    };

    expect(body.relation_entries.logs).toHaveLength(1);
  });

  it('404s an unknown resource and an unknown id', async () => {
    const { app } = build();

    expect((await app.request('/telescope/api/nonsense')).status).toBe(404);
    expect((await app.request('/telescope/api/logs/missing')).status).toBe(404);
  });

  it('clears every entry', async () => {
    const { app, recorder } = build();
    await recorder.record('log', { level: 1, message: 'x' });

    await app.request('/telescope/api/clear', { method: 'POST' });

    expect(await recorder.count('log')).toBe(0);
  });

  it('rejects unauthenticated requests when auth is configured', async () => {
    const { app } = build({ dashboard: { auth: { password: 'b', username: 'a' } } });

    expect((await app.request('/telescope/api/stats')).status).toBe(401);

    const authorised = await app.request('/telescope/api/stats', {
      headers: { authorization: `Basic ${btoa('a:b')}` },
    });
    expect(authorised.status).toBe(200);
  });

  it('gates the dashboard html route behind auth', async () => {
    const { app } = build({ dashboard: { auth: { password: 'b', username: 'a' } } });

    expect((await app.request('/telescope')).status).toBe(401);

    const authorised = await app.request('/telescope', {
      headers: { authorization: `Basic ${btoa('a:b')}` },
    });
    expect(authorised.status).toBe(200);
  });

  it('answers an unknown asset and an unknown resource with a JSON 404', async () => {
    const { app } = build();

    const asset = await app.request('/telescope/assets/nope.js');
    const resource = await app.request('/telescope/api/nope');

    expect(asset.status).toBe(404);
    expect(await asset.json()).toEqual({ error: 'Not found' });
    expect(resource.status).toBe(404);
    expect(await resource.json()).toEqual({ error: 'Not found' });
  });

  it('gates the asset route behind auth', async () => {
    const { app } = build({ dashboard: { auth: { password: 'b', username: 'a' } } });
    const { DASHBOARD_ASSETS } = await import('./dashboard-assets.js');
    const [file] = Object.entries(DASHBOARD_ASSETS)[0];

    expect((await app.request(`/telescope/assets/${file}`)).status).toBe(401);

    const authorised = await app.request(`/telescope/assets/${file}`, {
      headers: { authorization: `Basic ${btoa('a:b')}` },
    });
    expect(authorised.status).toBe(200);
  });

  it('refuses to mount in production without auth', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(() => build({ enabled: true })).toThrow(/dashboard\.auth/);
  });

  it('serves an inlined asset with its content type', async () => {
    const { app } = build();
    const { DASHBOARD_ASSETS } = await import('./dashboard-assets.js');
    const [file, asset] = Object.entries(DASHBOARD_ASSETS)[0];

    const response = await app.request(`/telescope/assets/${file}`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(asset.contentType);
  });
});
