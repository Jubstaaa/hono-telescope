import { TelescopeEntry, TelescopeStorage, ITelescopeRepository, EntryType, IncomingRequestEntry } from '@hono-telescope/types';
import { find } from 'lodash';

export class MemoryStorage implements ITelescopeRepository, TelescopeStorage {
  private entries: TelescopeEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  // ============ ITelescopeRepository Implementation ============

  async create(entry: TelescopeEntry): Promise<string> {
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
    return entry.id;
  }

  async findById(id: string): Promise<TelescopeEntry | null> {
    return find(this.entries, entry => entry.id === id) || null;
  }

  async findByType(type: EntryType, limit?: number): Promise<TelescopeEntry[]> {
    const filtered = this.entries.filter(entry => entry.type === type);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async findAll(limit?: number): Promise<TelescopeEntry[]> {
    return limit ? this.entries.slice(0, limit) : this.entries;
  }

  async findByParentId(parentId: string, limit?: number): Promise<TelescopeEntry[]> {
    const filtered = this.entries.filter(entry => entry.parent_id === parentId);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async findIncomingWithChildren(incomingRequestId: string): Promise<{
    parent: IncomingRequestEntry;
    children: TelescopeEntry[];
  } | null> {
    const parent = find(this.entries, entry => 
      entry.id === incomingRequestId && entry.type === EntryType.INCOMING_REQUEST
    ) as IncomingRequestEntry | undefined;

    if (!parent) return null;

    const children = this.entries.filter(entry => entry.parent_id === incomingRequestId);
    return { parent, children };
  }

  async count(type?: EntryType): Promise<number> {
    if (!type) return this.entries.length;
    return this.entries.filter(entry => entry.type === type).length;
  }

  async deleteOldEntries(beforeTimestamp: number): Promise<number> {
    const before = this.entries.length;
    this.entries = this.entries.filter(entry => entry.timestamp >= beforeTimestamp);
    return before - this.entries.length;
  }

  // ============ TelescopeStorage Legacy Methods ============

  async store(entry: TelescopeEntry): Promise<void> {
    await this.create(entry);
  }

  async get(type?: EntryType, limit: number = 50): Promise<TelescopeEntry[]> {
    return this.findByType(type || EntryType.INCOMING_REQUEST, limit);
  }

  async getEntries(type?: EntryType, limit: number = 50): Promise<TelescopeEntry[]> {
    return this.get(type, limit);
  }

  async getEntry(id: string): Promise<TelescopeEntry | null> {
    return this.findById(id);
  }

  async clear(): Promise<void> {
    this.entries = [];
  }

  async getChildEntries(parentId: string): Promise<TelescopeEntry[]> {
    return this.findByParentId(parentId);
  }

  async getIncomingRequestWithChildren(requestId: string): Promise<{
    request: TelescopeEntry;
    children: TelescopeEntry[];
  } | null> {
    const result = await this.findIncomingWithChildren(requestId);
    if (!result) return null;
    return { request: result.parent, children: result.children };
  }

  // ============ Utility Methods ============

  getByType(type: EntryType): TelescopeEntry[] {
    return this.entries.filter(entry => entry.type === type);
  }

  getById(id: string): TelescopeEntry | undefined {
    return find(this.entries, { id });
  }
}