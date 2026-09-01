import type { BaseEntry, EntryMap, EntryType } from '../../types/index.js';
import type { ListOptions, StorageAdapter } from './storage-adapter.js';

export interface MemoryStorageOptions {
  maxEntries?: number;
}

export function memoryStorage(options: MemoryStorageOptions = {}): StorageAdapter {
  const maxEntries = options.maxEntries ?? 1000;
  const buckets = new Map<EntryType, BaseEntry[]>();

  const bucket = (type: EntryType): BaseEntry[] => {
    const existing = buckets.get(type);
    if (existing) return existing;

    const created: BaseEntry[] = [];
    buckets.set(type, created);
    return created;
  };

  return {
    async record(type, entry) {
      const entries = bucket(type);
      entries.push(entry);
      if (entries.length > maxEntries) {
        entries.splice(0, entries.length - maxEntries);
      }
    },

    async list<T extends EntryType>(type: T, opts: ListOptions = {}) {
      const newestFirst = [...bucket(type)].reverse();
      const offset = opts.offset ?? 0;
      const sliced =
        opts.limit === undefined
          ? newestFirst.slice(offset)
          : newestFirst.slice(offset, offset + opts.limit);
      return sliced as EntryMap[T][];
    },

    async find<T extends EntryType>(type: T, id: string) {
      const found = bucket(type).find((entry) => entry.id === id);
      return (found ?? null) as EntryMap[T] | null;
    },

    async findByParent<T extends EntryType>(type: T, parentId: string) {
      return bucket(type).filter((entry) => entry.parent_id === parentId) as EntryMap[T][];
    },

    async count(type) {
      return bucket(type).length;
    },

    async clear() {
      buckets.clear();
    },
  };
}
