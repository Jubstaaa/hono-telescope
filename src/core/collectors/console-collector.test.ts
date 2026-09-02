import { describe, expect, it, vi } from 'vitest';

import { LogLevel } from '../../types/index.js';
import { alsContext } from '../context/als-context.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { consoleCollector } from './console-collector.js';

const build = () => {
  const storage = memoryStorage();
  return { recorder: new Recorder(storage, alsContext()), storage };
};

describe('consoleCollector', () => {
  it('records a log entry and still writes to the real console', async () => {
    const { recorder, storage } = build();
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const uninstall = consoleCollector().install(recorder);

    console.log('hello');
    await vi.waitFor(async () => expect(await storage.count('log')).toBe(1));

    uninstall();
    spy.mockRestore();

    expect((await storage.list('log'))[0]).toMatchObject({
      level: LogLevel.INFO,
      message: 'hello',
    });
  });

  it('maps each console method to a level', async () => {
    const { recorder, storage } = build();
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const uninstall = consoleCollector().install(recorder);

    console.debug('d');
    console.warn('w');
    console.error('e');
    await vi.waitFor(async () => expect(await storage.count('log')).toBe(3));
    uninstall();

    const levels = (await storage.list('log')).map((entry) => entry.level).sort();
    expect(levels).toEqual([LogLevel.DEBUG, LogLevel.WARNING, LogLevel.ERROR].sort());
  });

  it('restores the exact original functions on uninstall', () => {
    const { recorder } = build();
    const original = console.log;

    const uninstall = consoleCollector().install(recorder);
    expect(console.log).not.toBe(original);

    uninstall();
    expect(console.log).toBe(original);
  });

  it('is idempotent: a second install does not double-patch', async () => {
    const { recorder, storage } = build();
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const collector = consoleCollector();

    const uninstallA = collector.install(recorder);
    const uninstallB = collector.install(recorder);

    console.log('once');
    await vi.waitFor(async () => expect(await storage.count('log')).toBe(1));

    uninstallB();
    uninstallA();
  });

  it('does not record an exception entry for console.error', async () => {
    const { recorder, storage } = build();
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const uninstall = consoleCollector().install(recorder);

    console.error('not an exception');
    await vi.waitFor(async () => expect(await storage.count('log')).toBe(1));
    uninstall();

    expect(await storage.count('exception')).toBe(0);
  });
});
