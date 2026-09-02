import { describe, expect, it, vi } from 'vitest';

import { alsContext } from '../context/als-context.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { fetchCollector } from './fetch-collector.js';

const build = () => {
  const storage = memoryStorage();
  return { recorder: new Recorder(storage, alsContext()), storage };
};

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

describe('fetchCollector', () => {
  it('records an outgoing request', async () => {
    const { recorder, storage } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () =>
        new Response('{"ok":true}', {
          headers: { 'content-type': 'application/json' },
          status: 201,
        })
    ) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await fetch('https://example.test/items', { method: 'POST' });
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry).toMatchObject({
      method: 'POST',
      response_status: 201,
      uri: 'https://example.test/items',
    });
  });

  it('keeps a successful fetch successful when the headers cannot be read', async () => {
    const { recorder, storage } = build();
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response('ok')) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    const response = await fetch('https://example.test/x', {
      headers: { 'bad header': 'value' } as unknown as HeadersInit,
    });
    uninstall();
    globalThis.fetch = original;

    expect(response.status).toBe(200);
    expect((await storage.list('outgoing_request'))[0].headers).toEqual({});
  });

  it('records a failed request as a 0-status entry and rethrows', async () => {
    const { recorder, storage } = build();
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
    const { recorder, storage } = build();
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
            headers: { 'content-type': 'application/json' },
            status: 200,
          }
        )
    ) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    const response = await fetch('https://example.test/fail-capture');
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry).toMatchObject({
      response: { error: 'response capture failed' },
      response_status: 200,
    });
    expect(response.status).toBe(200);
  });

  it('captures headers from Request when no init provided', async () => {
    const { recorder, storage } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response('ok')) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await fetch(
      new Request('https://example.test/headers', {
        headers: { accept: 'application/json', authorization: 'Bearer secret' },
      })
    );
    uninstall();
    globalThis.fetch = original;

    const [entry] = await storage.list('outgoing_request');
    expect(entry.headers).toMatchObject({
      accept: 'application/json',
      authorization: '[REDACTED]',
    });
  });

  it('prefers init.headers over Request headers', async () => {
    const { recorder, storage } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response('ok')) as unknown as typeof fetch;

    const uninstall = fetchCollector().install(recorder);
    await fetch(
      new Request('https://example.test/headers', {
        headers: { accept: 'ignored', authorization: 'Bearer ignored' },
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
    const { recorder, storage } = build();
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () =>
        new Response('{"data":123}', {
          headers: { 'content-type': 'application/json' },
          status: 200,
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

  it('completes an oversize json response and leaves the body readable', async () => {
    const { recorder, storage } = build();
    const payload = { data: 'x'.repeat(500) };
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify(payload), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        })
    ) as unknown as typeof fetch;

    const uninstall = fetchCollector({ maxBodySize: 50 }).install(recorder);
    const call = fetch('https://example.test/big');
    uninstall();
    globalThis.fetch = original;

    expect(await settleWithin(call)).toBe('completed');
    expect(await (await call).json()).toEqual(payload);
    expect((await storage.list('outgoing_request'))[0].response).toEqual({
      size: 50,
      truncated: true,
    });
  });
});

describe('fetchCollector outgoing payload', () => {
  const stubFetch = () => {
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(
      async () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } })
    ) as unknown as typeof fetch;

    return () => {
      globalThis.fetch = original;
    };
  };

  const payloadOf = async (
    storage: ReturnType<typeof build>['storage']
  ): Promise<Record<string, unknown>> => {
    await vi.waitFor(async () => expect(await storage.count('outgoing_request')).toBe(1));
    return (await storage.list('outgoing_request'))[0].payload;
  };

  it('records a JSON string body and redacts inside it', async () => {
    const { recorder, storage } = build();
    const restore = stubFetch();
    const uninstall = fetchCollector().install(recorder);

    await fetch('https://example.test/charge', {
      body: JSON.stringify({ amount: 10, token: 'secret-token' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    uninstall();
    restore();

    expect(await payloadOf(storage)).toEqual({ amount: 10, token: '[REDACTED]' });
  });

  it('records a URLSearchParams body as an object and redacts it', async () => {
    const { recorder, storage } = build();
    const restore = stubFetch();
    const uninstall = fetchCollector().install(recorder);

    await fetch('https://example.test/token', {
      body: new URLSearchParams({ grant_type: 'client_credentials', secret: 'sh' }),
      method: 'POST',
    });

    uninstall();
    restore();

    expect(await payloadOf(storage)).toEqual({
      grant_type: 'client_credentials',
      secret: '[REDACTED]',
    });
  });

  it('records metadata only for a body over the cap', async () => {
    const { recorder, storage } = build();
    const restore = stubFetch();
    const uninstall = fetchCollector({ maxBodySize: 32 }).install(recorder);

    await fetch('https://example.test/bulk', {
      body: JSON.stringify({ note: 'x'.repeat(200) }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    uninstall();
    restore();

    expect(await payloadOf(storage)).toMatchObject({ truncated: true });
  });

  it('skips a stream body rather than consuming what the caller is sending', async () => {
    const { recorder, storage } = build();
    const restore = stubFetch();
    const uninstall = fetchCollector().install(recorder);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"a":1}'));
        controller.close();
      },
    });

    const settled = await settleWithin(
      fetch('https://example.test/stream', {
        body: stream,
        duplex: 'half',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      } as RequestInit)
    );

    uninstall();
    restore();

    expect(settled).toBe('completed');
    expect(await payloadOf(storage)).toEqual({});
  });

  it('skips the body of a Request object', async () => {
    const { recorder, storage } = build();
    const restore = stubFetch();
    const uninstall = fetchCollector().install(recorder);

    await fetch(
      new Request('https://example.test/req', {
        body: JSON.stringify({ a: 1 }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
    );

    uninstall();
    restore();

    expect(await payloadOf(storage)).toEqual({});
  });
});
