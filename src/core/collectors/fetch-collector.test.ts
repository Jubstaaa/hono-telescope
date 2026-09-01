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

  it('returns original response when body capture fails', async () => {
    const { storage, recorder } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new Error('stream boom'));
            },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        )
    ) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    const response = await fetch('https://example.test/fail-capture');
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry).toMatchObject({
      response_status: 200,
      response: { error: 'response capture failed' },
    });
    expect(response.status).toBe(200);
  });

  it('captures headers from Request when no init provided', async () => {
    const { storage, recorder } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response('ok')) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await fetch(
      new Request('https://example.test/headers', {
        headers: { authorization: 'Bearer secret', accept: 'application/json' },
      })
    );
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry.headers).toMatchObject({
      authorization: '[REDACTED]',
      accept: 'application/json',
    });
  });

  it('prefers init.headers over Request headers', async () => {
    const { storage, recorder } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response('ok')) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await fetch(
      new Request('https://example.test/headers', {
        headers: { authorization: 'Bearer ignored', accept: 'ignored' },
      }),
      {
        headers: { authorization: 'Bearer override', 'x-custom': 'value' },
      }
    );
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry.headers).toMatchObject({
      authorization: '[REDACTED]',
      'x-custom': 'value',
    });
    expect(entry.headers.accept).toBeUndefined();
  });

  it('captures response headers on success', async () => {
    const { storage, recorder } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () =>
        new Response('{"data":123}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    ) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await fetch('https://example.test/json');
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry.response_headers).toMatchObject({
      'content-type': 'application/json',
    });
  });
});
