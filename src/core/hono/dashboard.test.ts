import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TelescopeConfig } from '../config.js';
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
    expect(html).toContain('<meta name="telescope-base" content="/debug">');
    expect(html).toContain('src="/debug/assets/');
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

    await app.request('/telescope/api/clear', {
      headers: { 'sec-fetch-site': 'same-origin' },
      method: 'POST',
    });

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

  it('escapes the base path where it lands in the html', async () => {
    const { app } = build({ dashboardPath: '/a"><script>x</script>' });

    const html = await (await app.request('/a"><script>x</script>')).text();

    expect(html).not.toContain('<script>x</script>');
  });

  it('caches content-hashed assets for good', async () => {
    const { app } = build();
    const { DASHBOARD_ASSETS } = await import('./dashboard-assets.js');
    const [file] = Object.entries(DASHBOARD_ASSETS)[0];

    const response = await app.request(`/telescope/assets/${file}`);

    expect(response.headers.get('cache-control')).toBe('max-age=31536000, immutable');
  });

  it('sends a CSP that runs no inline script, and refuses framing by other origins', async () => {
    const { app } = build();

    const response = await app.request('/telescope');
    const csp = response.headers.get('content-security-policy') ?? '';

    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).toContain("frame-ancestors 'self'");
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.text()).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
  });

  it('leaves HSTS to the app, which may serve the dashboard over plain http', async () => {
    const { app } = build();

    expect((await app.request('/telescope')).headers.get('strict-transport-security')).toBeNull();
  });

  it('refuses a cross-site form post to clear the data', async () => {
    const { app, recorder } = build();
    await recorder.record('log', { level: 1, message: 'x' });

    const response = await app.request('http://localhost/telescope/api/clear', {
      body: 'x=1',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://evil.example',
      },
      method: 'POST',
    });

    expect(response.status).toBe(403);
    expect(await recorder.count('log')).toBe(1);
  });

  it('still clears on a same-origin request from the dashboard', async () => {
    const { app, recorder } = build();
    await recorder.record('log', { level: 1, message: 'x' });

    const response = await app.request('http://localhost/telescope/api/clear', {
      headers: { origin: 'http://localhost' },
      method: 'POST',
    });

    expect(response.status).toBe(200);
    expect(await recorder.count('log')).toBe(0);
  });

  it('clears behind a TLS-terminating proxy, where the app sees http and the browser https', async () => {
    const { app, recorder } = build();
    await recorder.record('log', { level: 1, message: 'x' });

    const response = await app.request('http://telescope.example/telescope/api/clear', {
      headers: { origin: 'https://telescope.example' },
      method: 'POST',
    });

    expect(response.status).toBe(200);
    expect(await recorder.count('log')).toBe(0);
  });

  it('refuses a cross-site post that sends Origin: null', async () => {
    const { app } = build();

    const response = await app.request('http://localhost/telescope/api/clear', {
      headers: { origin: 'null' },
      method: 'POST',
    });

    expect(response.status).toBe(403);
  });

  it('asks intermediaries not to inject scripts its CSP would block', async () => {
    const { app } = build();

    const response = await app.request('/telescope/incoming-requests');

    expect(response.headers.get('cache-control')).toContain('no-transform');
  });
});
