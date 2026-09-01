import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createTelescope } from './create-telescope';
import { memoryStorage } from './storage/memory-storage';

describe('createTelescope', () => {
  it('installs the default collectors and uninstalls them on stop', () => {
    const originalLog = console.log;
    const originalFetch = globalThis.fetch;

    const telescope = createTelescope({ storage: memoryStorage(), enabled: true });
    expect(console.log).not.toBe(originalLog);
    expect(globalThis.fetch).not.toBe(originalFetch);

    telescope.stop();
    expect(console.log).toBe(originalLog);
    expect(globalThis.fetch).toBe(originalFetch);
  });

  it('records through the mounted middleware', async () => {
    const storage = memoryStorage();
    const telescope = createTelescope({ storage, enabled: true });
    const app = new Hono();
    app.use('*', telescope.middleware());
    app.get('/x', (c) => c.text('ok'));

    await app.request('/x');
    telescope.stop();

    expect(await storage.count('incoming_request')).toBe(1);
  });

  it('is inert when disabled', async () => {
    const originalLog = console.log;
    const storage = memoryStorage();
    const telescope = createTelescope({ storage, enabled: false });

    expect(console.log).toBe(originalLog);

    const app = new Hono();
    app.use('*', telescope.middleware());
    app.get('/x', (c) => c.text('ok'));
    await app.request('/x');

    expect(await storage.count('incoming_request')).toBe(0);
    expect(telescope.instrumentPrisma('untouched')).toBe('untouched');

    telescope.stop();
  });

  it('defaults to disabled under NODE_ENV=production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const storage = memoryStorage();
    const telescope = createTelescope({ storage });

    const app = new Hono();
    app.use('*', telescope.middleware());
    app.get('/x', (c) => c.text('ok'));
    await app.request('/x');

    expect(await storage.count('incoming_request')).toBe(0);
    telescope.stop();
    vi.unstubAllEnvs();
  });

  it('stop is safe to call twice', () => {
    const telescope = createTelescope({ storage: memoryStorage(), enabled: true });

    telescope.stop();
    expect(() => telescope.stop()).not.toThrow();
  });
});
