import { describe, expect, it, vi } from 'vitest';
import { consoleCollector } from './console-collector';
import { Recorder } from '../recorder';
import { memoryStorage } from '../storage/memory-storage';
import { alsContext } from '../context/als-context';
import { LogLevel } from '@/types';

const build = () => {
  const storage = memoryStorage();
  return { storage, recorder: new Recorder(storage, alsContext()) };
};

describe('consoleCollector', () => {
  it('records a log entry and still writes to the real console', async () => {
    const { storage, recorder } = build();
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const uninstall = consoleCollector().install(recorder);

    console.log('hello');
    await vi.waitFor(async () => expect(await storage.count('log')).toBe(1));

    uninstall();
    spy.mockRestore();

    expect((await storage.list('log'))[0]).toMatchObject({
      message: 'hello',
      level: LogLevel.INFO,
    });
  });

  it('maps each console method to a level', async () => {
    const { storage, recorder } = build();
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
    const { storage, recorder } = build();
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
    const { storage, recorder } = build();
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const uninstall = consoleCollector().install(recorder);

    console.error('not an exception');
    await vi.waitFor(async () => expect(await storage.count('log')).toBe(1));
    uninstall();

    expect(await storage.count('exception')).toBe(0);
  });
});
