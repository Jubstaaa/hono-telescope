import { TelescopeEntry, TelescopeStorage, EntryType } from '../types';
import { filter, find } from 'lodash';

export class MemoryStorage implements TelescopeStorage {
  private entries: TelescopeEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  async store(entry: TelescopeEntry): Promise<void> {
    this.entries.unshift(entry);
    
    // Keep only the latest entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  async get(type?: EntryType, limit: number = 50): Promise<TelescopeEntry[]> {
    let filtered = this.entries;
    
    if (type) {
      filtered = filter(this.entries, entry => {
        return entry.type === type;
      });
    }
    
    const result = filtered.slice(0, limit);
    return result;
  }

  async getEntries(type?: EntryType, limit: number = 50): Promise<TelescopeEntry[]> {
    return this.get(type, limit);
  }

  async getEntry(id: string): Promise<TelescopeEntry | null> {
    const entry = find(this.entries, entry => entry.id === id);
    return entry || null;
  }

  async clear(): Promise<void> {
    this.entries = [];
  }

  async count(): Promise<number> {
    return this.entries.length;
  }

  async getChildEntries(parentId: string): Promise<TelescopeEntry[]> {
    return filter(this.entries, entry => entry.parent_id === parentId);
  }

  async getIncomingRequestWithChildren(requestId: string): Promise<{
    request: TelescopeEntry;
    children: TelescopeEntry[];
  } | null> {
    const request = find(this.entries, entry => 
      entry.id === requestId && entry.type === EntryType.INCOMING_REQUEST
    );
    
    if (!request) {
      return null;
    }

    const children = filter(this.entries, entry => entry.request_id === requestId);
    
    return {
      request,
      children
    };
  }

  getByType(type: EntryType): TelescopeEntry[] {
    return filter(this.entries, entry => entry.type === type);
  }

  getById(id: string): TelescopeEntry | undefined {
    return find(this.entries, entry => entry.id === id);
  }
}