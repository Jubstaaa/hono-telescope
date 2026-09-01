import { randomUUID } from 'node:crypto';
import type { CreateInputMap, EntryMap, EntryType, QueryCreateInput } from '../types/index.js';
import type { ListOptions, StorageAdapter } from './storage/storage-adapter.js';
import type { ContextStrategy } from './context/context-strategy.js';

export class Recorder {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly context: ContextStrategy
  ) {}

  async record<T extends EntryType>(
    type: T,
    input: CreateInputMap[T],
    id?: string
  ): Promise<string> {
    const explicitParent = (input as { parent_id?: string }).parent_id;
    const inheritedParent =
      type === 'incoming_request' ? undefined : this.context.current()?.requestId;

    const entry = {
      ...input,
      id: id ?? randomUUID(),
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
      parent_id: explicitParent ?? inheritedParent,
    } as EntryMap[T];

    await this.storage.record(type, entry);
    return entry.id;
  }

  recordQuery(input: QueryCreateInput): Promise<string> {
    return this.record('query', input);
  }

  list<T extends EntryType>(type: T, opts?: ListOptions): Promise<EntryMap[T][]> {
    return this.storage.list(type, opts);
  }

  find<T extends EntryType>(type: T, id: string): Promise<EntryMap[T] | null> {
    return this.storage.find(type, id);
  }

  findByParent<T extends EntryType>(type: T, parentId: string): Promise<EntryMap[T][]> {
    return this.storage.findByParent(type, parentId);
  }

  count(type: EntryType): Promise<number> {
    return this.storage.count(type);
  }

  clear(): Promise<void> {
    return this.storage.clear();
  }
}
