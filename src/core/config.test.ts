import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveConfig } from './config';
import { memoryStorage } from './storage/memory-storage';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveConfig', () => {
  it('enables Telescope when a partial config omits `enabled`', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(resolveConfig({ dashboardPath: '/debug' }).enabled).toBe(true);
  });

  it('defaults to disabled in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(resolveConfig().enabled).toBe(false);
  });

  it('respects an explicit enabled flag in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(resolveConfig({ enabled: true }).enabled).toBe(true);
  });

  it('normalises dashboardPath to a leading slash with no trailing slash', () => {
    expect(resolveConfig({ dashboardPath: 'debug/' }).dashboardPath).toBe('/debug');
    expect(resolveConfig().dashboardPath).toBe('/telescope');
  });

  it('fills capture and redact defaults', () => {
    const resolved = resolveConfig();

    expect(resolved.capture).toEqual({
      requestBody: true,
      responseBody: true,
      maxBodySize: 65536,
    });
    expect(resolved.redact.headers).toContain('set-cookie');
    expect(resolved.redact.bodyKeys).toContain('password');
  });

  it('merges partial capture config without dropping the other defaults', () => {
    const resolved = resolveConfig({ capture: { maxBodySize: 10 } });

    expect(resolved.capture).toEqual({
      requestBody: true,
      responseBody: true,
      maxBodySize: 10,
    });
  });

  it('keeps a caller-supplied storage adapter', () => {
    const storage = memoryStorage({ maxEntries: 5 });

    expect(resolveConfig({ storage }).storage).toBe(storage);
  });

  it('always includes the dashboard path in ignorePaths', () => {
    expect(resolveConfig({ dashboardPath: '/debug' }).ignorePaths).toContain('/debug');
  });
});
