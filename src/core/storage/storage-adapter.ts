import type { EntryMap, EntryType } from '../../types/index.js';

export interface ListOptions {
  limit?: number;
  offset?: number;
}

/**
 * Adapters are verified by the contract suite exported from `hono-telescope/testing`:
 * `runStorageContract('my-adapter', () => myAdapter())`.
 */
export interface StorageAdapter {
  clear(): Promise<void>;
  count(type: EntryType): Promise<number>;
  find<T extends EntryType>(type: T, id: string): Promise<EntryMap[T] | null>;
  /** Oldest first, so a request's children read in the order they happened. */
  findByParent<T extends EntryType>(type: T, parentId: string): Promise<EntryMap[T][]>;
  /** Newest first. `limit` and `offset` apply to that order. */
  list<T extends EntryType>(type: T, opts?: ListOptions): Promise<EntryMap[T][]>;
  record<T extends EntryType>(type: T, entry: EntryMap[T]): Promise<void>;
}
