import type { EntryMap, EntryType } from '../../types/index.js';

export interface ListOptions {
  limit?: number;
  offset?: number;
}

export interface StorageAdapter {
  record<T extends EntryType>(type: T, entry: EntryMap[T]): Promise<void>;
  list<T extends EntryType>(type: T, opts?: ListOptions): Promise<EntryMap[T][]>;
  find<T extends EntryType>(type: T, id: string): Promise<EntryMap[T] | null>;
  findByParent<T extends EntryType>(type: T, parentId: string): Promise<EntryMap[T][]>;
  count(type: EntryType): Promise<number>;
  clear(): Promise<void>;
}
