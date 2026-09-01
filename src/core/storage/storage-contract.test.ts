import { describe, expect, it } from 'vitest';
import { memoryStorage } from './memory-storage.js';
import { runStorageContract } from './storage-contract.js';
import type { LogEntry } from '../../types/index.js';

function logEntry(id: string): LogEntry {
  return {
    id,
    timestamp: Date.now(),
    created_at: new Date().toISOString(),
    level: 1,
    message: `message ${id}`,
  };
}

runStorageContract('memoryStorage', () => memoryStorage());

describe('memoryStorage specifics', () => {
  it('trims to maxEntries, dropping the oldest', async () => {
    const storage = memoryStorage({ maxEntries: 2 });
    await storage.record('log', logEntry('a'));
    await storage.record('log', logEntry('b'));
    await storage.record('log', logEntry('c'));

    expect(await storage.count('log')).toBe(2);
    expect((await storage.list('log')).map((e) => e.id)).toEqual(['c', 'b']);
  });
});
