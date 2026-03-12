import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { Telescope } from '../telescope';
import { setupTelescope } from '../index';

describe('telescope middleware', () => {
  let app: Hono;

  beforeEach(async () => {
    const telescope = Telescope.getInstance({ max_entries: 100 });
    await telescope.clearAllData();

    app = new Hono();
    setupTelescope(app, { enabled: true, max_entries: 100 });

    app.get('/test', (c) => c.json({ ok: true }));

    app.post('/test-json', async (c) => {
      const body = await c.req.json();
      return c.json({ received: body });
    });

    app.post('/test-form', async (c) => {
      const body = await c.req.parseBody();
      return c.json({ received: body });
    });

    app.get('/test-error', () => {
      throw new Error('Test error');
    });
  });

  it('should record incoming GET request', async () => {
    const res = await app.request('/test');
    expect(res.status).toBe(200);

    const telescope = Telescope.getInstance();
    const requests = await telescope.getAllIncomingRequests();
    const entry = requests.find((r) => r.uri === '/test');

    expect(entry).toBeDefined();
    expect(entry!.method).toBe('GET');
    expect(entry!.response_status).toBe(200);
    expect(entry!.duration).toBeGreaterThanOrEqual(0);
  });

  it('should record incoming POST with JSON body', async () => {
    const res = await app.request('/test-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });

    expect(res.status).toBe(200);

    const telescope = Telescope.getInstance();
    const requests = await telescope.getAllIncomingRequests();
    const entry = requests.find((r) => r.uri === '/test-json');

    expect(entry).toBeDefined();
    expect(entry!.method).toBe('POST');
    expect(entry!.payload).toEqual({ name: 'test' });
  });

  it('should record incoming POST with form-urlencoded body (bug fix)', async () => {
    const res = await app.request('/test-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=test&email=test@test.com',
    });

    expect(res.status).toBe(200);

    const telescope = Telescope.getInstance();
    const requests = await telescope.getAllIncomingRequests();
    const entry = requests.find((r) => r.uri === '/test-form');

    expect(entry).toBeDefined();
    expect(entry!.method).toBe('POST');
    expect(entry!.payload).toHaveProperty('name', 'test');
    expect(entry!.payload).toHaveProperty('email', 'test@test.com');
  });

  it('should skip telescope routes', async () => {
    const res = await app.request('/telescope/api/stats');
    expect(res.status).toBe(200);

    const telescope = Telescope.getInstance();
    const requests = await telescope.getAllIncomingRequests();
    const telescopeEntries = requests.filter((r) => r.uri.startsWith('/telescope'));

    expect(telescopeEntries).toHaveLength(0);
  });

  it('should skip static assets', async () => {
    await app.request('/style.css');

    const telescope = Telescope.getInstance();
    const requests = await telescope.getAllIncomingRequests();
    const cssEntries = requests.filter((r) => r.uri.endsWith('.css'));

    expect(cssEntries).toHaveLength(0);
  });

  it('should record errors and return 500', async () => {
    const res = await app.request('/test-error');
    expect(res.status).toBe(500);

    const telescope = Telescope.getInstance();
    const exceptions = await telescope.getAllExceptions();

    expect(exceptions.length).toBeGreaterThanOrEqual(1);
    const entry = exceptions.find((e) => e.message === 'Test error');
    expect(entry).toBeDefined();
  });

  it('should record request duration', async () => {
    const res = await app.request('/test');
    expect(res.status).toBe(200);

    const telescope = Telescope.getInstance();
    const requests = await telescope.getAllIncomingRequests();
    const entry = requests.find((r) => r.uri === '/test');

    expect(entry!.duration).toBeTypeOf('number');
    expect(entry!.duration).toBeGreaterThanOrEqual(0);
  });

  it('should return stats from api', async () => {
    await app.request('/test');
    await app.request('/test');

    const statsRes = await app.request('/telescope/api/stats');
    const stats = await statsRes.json();

    expect(stats.incomingRequests.total).toBeGreaterThanOrEqual(2);
  });

  it('should clear data via api', async () => {
    await app.request('/test');

    const clearRes = await app.request('/telescope/api/clear', { method: 'POST' });
    expect(clearRes.status).toBe(200);

    const statsRes = await app.request('/telescope/api/stats');
    const stats = await statsRes.json();

    expect(stats.incomingRequests.total).toBe(0);
  });
});
