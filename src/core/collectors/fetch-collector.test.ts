import { describe, expect, it, vi } from 'vitest';
import { fetchCollector } from './fetch-collector';
import { Recorder } from '../recorder';
import { memoryStorage } from '../storage/memory-storage';
import { alsContext } from '../context/als-context';

const build = () => {
  const storage = memoryStorage();
  return { storage, recorder: new Recorder(storage, alsContext()) };
};

describe('fetchCollector', () => {
  it('records an outgoing request', async () => {
    const { storage, recorder } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () =>
        new Response('{"ok":true}', {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
    ) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await fetch('https://example.test/items', { method: 'POST' });
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry).toMatchObject({
      method: 'POST',
      uri: 'https://example.test/items',
      response_status: 201,
    });
  });

  it('records a failed request as a 0-status entry and rethrows', async () => {
    const { storage, recorder } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await expect(fetch('https://example.test/x')).rejects.toThrow('network down');
    uninstall();
    globalThis.fetch = original;

    expect((await storage.list('outgoing_request'))[0]).toMatchObject({ response_status: 0 });
  });

  it('restores the original fetch on uninstall and is idempotent', () => {
    const { recorder } = build();
    const original = globalThis.fetch;
    const collector = fetchCollector();

    const uninstallA = collector.install(recorder);
    const patched = globalThis.fetch;
    collector.install(recorder);

    expect(globalThis.fetch).toBe(patched);

    uninstallA();
    expect(globalThis.fetch).toBe(original);
  });
});
