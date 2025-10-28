import { TelescopeConfig, TelescopeEntry, TelescopeStorage, EntryType } from './types';
import { MemoryStorage } from './storage/memory-storage';
import { generateId } from './utils';
import { filter, some } from 'lodash';

export class Telescope {
  private static instance: Telescope;
  private config: TelescopeConfig;
  private storage: TelescopeStorage;

  private constructor(config: Partial<TelescopeConfig> = {}) {
    this.config = {
      enabled: true,
      path: '/telescope',
      storage: 'memory',
      ignore_paths: [
        '/telescope',
        '/.well-known',
        '/robots.txt',
        '/favicon.ico',
        '/sitemap.xml',
        '/apple-touch-icon.png',
        '/manifest.json'
      ],
      ignore_commands: [],
      watchers: {
        [EntryType.INCOMING_REQUEST]: true,
        [EntryType.OUTGOING_REQUEST]: true,
        [EntryType.EXCEPTION]: true,
        [EntryType.LOG]: true,
        [EntryType.QUERY]: true,
        [EntryType.CACHE]: true,
        [EntryType.JOB]: true,
        [EntryType.MAIL]: true,
        [EntryType.NOTIFICATION]: true,
        [EntryType.DUMP]: true,
      },
      max_entries: 1000,
      ...config
    };

    this.storage = new MemoryStorage(this.config.max_entries);
  }

  public static getInstance(config?: Partial<TelescopeConfig>): Telescope {
    if (!Telescope.instance) {
      Telescope.instance = new Telescope(config);
    }
    return Telescope.instance;
  }

  public async record(type: EntryType, content: any, tags?: string[], parentId?: string, requestId?: string, customId?: string): Promise<string> {
    if (!this.config.enabled || !this.config.watchers?.[type]) {
      return '';
    }

    const entryId = customId || generateId();
    const entry: TelescopeEntry = {
      id: entryId,
      type,
      timestamp: Date.now(),
      content,
      tags,
      family_hash: this.generateFamilyHash(type, content),
      parent_id: parentId,
      request_id: requestId
    };

    await this.storage.store(entry);
    return entryId;
  }

  public async getEntries(type?: EntryType, limit?: number): Promise<TelescopeEntry[]> {
    return this.storage.getEntries(type, limit);
  }

  public async getEntry(id: string): Promise<TelescopeEntry | null> {
    return await this.storage.getEntry(id);
  }

  // New hierarchical methods
  public async getIncomingRequestWithChildren(requestId: string): Promise<any> {
    return await this.storage.getIncomingRequestWithChildren(requestId);
  }

  public async getChildEntries(parentId: string, type?: EntryType, limit: number = 50): Promise<TelescopeEntry[]> {
    const allChildren = await this.storage.getChildEntries(parentId);
    
    // Filter by type if specified
    let filtered = type ? filter(allChildren, entry => entry.type === type) : allChildren;
    
    // Apply limit
    return filtered.slice(0, limit);
  }

  public async clearEntries(): Promise<void> {
    await this.storage.clear();
  }

  public async getEntriesCount(): Promise<number> {
    return await this.storage.count();
  }

  public getConfig(): TelescopeConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<TelescopeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private generateFamilyHash(type: EntryType, content: any): string {
    // Generate a hash for grouping similar entries
    switch (type) {
      case EntryType.INCOMING_REQUEST:
      case EntryType.OUTGOING_REQUEST:
        return `${content.method}:${content.uri}`;
      case EntryType.EXCEPTION:
        return `${content.class}:${content.file}:${content.line}`;
      case EntryType.QUERY:
        return content.sql;
      default:
        return type;
    }
  }

  public shouldIgnore(path: string): boolean {
    return some(this.config.ignore_paths, ignorePath => 
      path.startsWith(ignorePath)
    ) || false;
  }
}