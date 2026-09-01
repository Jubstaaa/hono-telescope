import { describe, expect, it } from 'vitest';
import type { StorageAdapter } from './storage-adapter.js';
import type { LogEntry } from '../../types/index.js';

function logEntry(id: string, parentId?: string): LogEntry {
  return {
    id,
    timestamp: Date.now(),
    created_at: new Date().toISOString(),
    parent_id: parentId,
    level: 1,
    message: `message ${id}`,
  };
}

export function runStorageContract(name: string, factory: () => StorageAdapter): void {
  describe(`StorageAdapter contract: ${name}`, () => {
    it('records an entry and finds it by id', async () => {
      const storage = factory();
      await storage.record('log', logEntry('a'));

      expect(await storage.find('log', 'a')).toMatchObject({ id: 'a' });
    });

    it('returns null for an unknown id', async () => {
      const storage = factory();

      expect(await storage.find('log', 'missing')).toBeNull();
    });

    it('lists newest first', async () => {
      const storage = factory();
      await storage.record('log', logEntry('a'));
      await storage.record('log', logEntry('b'));

      expect((await storage.list('log')).map((e) => e.id)).toEqual(['b', 'a']);
    });

    it('applies limit and offset to the newest-first order', async () => {
      const storage = factory();
      await storage.record('log', logEntry('a'));
      await storage.record('log', logEntry('b'));
      await storage.record('log', logEntry('c'));

      expect((await storage.list('log', { limit: 2 })).map((e) => e.id)).toEqual(['c', 'b']);
      expect((await storage.list('log', { offset: 1, limit: 1 })).map((e) => e.id)).toEqual(['b']);
    });

    it('finds children by parent id, oldest first', async () => {
      const storage = factory();
      await storage.record('log', logEntry('a', 'req-1'));
      await storage.record('log', logEntry('b', 'req-2'));
      await storage.record('log', logEntry('c', 'req-1'));

      expect((await storage.findByParent('log', 'req-1')).map((e) => e.id)).toEqual(['a', 'c']);
    });

    it('keeps entry types isolated from each other', async () => {
      const storage = factory();
      await storage.record('log', logEntry('a'));

      expect(await storage.count('log')).toBe(1);
      expect(await storage.count('exception')).toBe(0);
      expect(await storage.list('exception')).toEqual([]);
    });

    it('clears every type', async () => {
      const storage = factory();
      await storage.record('log', logEntry('a'));
      await storage.clear();

      expect(await storage.count('log')).toBe(0);
    });
  });
}
