import { describe, expect, it } from 'vitest';

import type { LogEntry } from '../../types/index.js';

import { memoryStorage } from './memory-storage.js';
import { runStorageContract } from './storage-contract.js';

function logEntry(id: string): LogEntry {
  return {
    created_at: new Date().toISOString(),
    id,
    level: 1,
    message: `message ${id}`,
    timestamp: Date.now(),
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
