import { describe, expect, it, vi } from 'vitest';

import { alsContext } from '../context/als-context.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { exceptionCollector } from './exception-collector.js';

const build = () => {
  const storage = memoryStorage();
  return { recorder: new Recorder(storage, alsContext()), storage };
};

describe('exceptionCollector', () => {
  it('records an uncaught exception', async () => {
    const { recorder, storage } = build();
    const before = process.listeners('uncaughtException');

    const uninstall = exceptionCollector().install(recorder);
    const added = process.listeners('uncaughtException').filter((l) => !before.includes(l));
    expect(added).toHaveLength(1);

    (added[0] as (error: Error) => void)(new Error('boom'));
    await vi.waitFor(async () => expect(await storage.count('exception')).toBe(1));
    uninstall();

    expect((await storage.list('exception'))[0]).toMatchObject({ message: 'boom' });
  });

  it('records an unhandled rejection, coercing a non-Error reason', async () => {
    const { recorder, storage } = build();
    const before = process.listeners('unhandledRejection');

    const uninstall = exceptionCollector().install(recorder);
    const added = process.listeners('unhandledRejection').filter((l) => !before.includes(l));
    expect(added).toHaveLength(1);

    (added[0] as (reason: unknown, promise: Promise<unknown>) => void)('nope', Promise.resolve());
    await vi.waitFor(async () => expect(await storage.count('exception')).toBe(1));
    uninstall();

    expect((await storage.list('exception'))[0].message).toBe('nope');
  });

  it('removes its listeners on uninstall', () => {
    const { recorder } = build();
    const before = process.listenerCount('uncaughtException');

    const uninstall = exceptionCollector().install(recorder);
    expect(process.listenerCount('uncaughtException')).toBe(before + 1);

    uninstall();
    expect(process.listenerCount('uncaughtException')).toBe(before);
  });

  it('does not patch console.error', () => {
    const { recorder } = build();
    const original = console.error;

    const uninstall = exceptionCollector().install(recorder);
    expect(console.error).toBe(original);

    uninstall();
  });
});
