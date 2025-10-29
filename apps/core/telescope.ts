import { 
  TelescopeConfig, 
  TelescopeEntry, 
  ITelescopeRepository,
  EntryType, 
  IncomingRequestEntry,
  OutgoingRequestEntry,
  LogEntryData,
  QueryEntryData,
  ExceptionEntryData
} from '@hono-telescope/types';
import { MemoryStorage } from './storage/memory-storage';
import { generateId } from './utils';
import { filter, some } from 'lodash';

/**
 * Telescope - Main entry point for recording and querying telescope data
 * 
 * Architecture:
 * - Singleton pattern for instance management
 * - Parent-Child relationship (Incoming Request as parent)
 * - Type-safe record methods per entry type
 * - Clean repository pattern for storage
 */
export class Telescope {
  private static instance: Telescope;
  private config: TelescopeConfig;
  private repository: ITelescopeRepository;

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
      },
      max_entries: 1000,
      ...config
    };

    this.repository = new MemoryStorage(this.config.max_entries);
  }

  public static getInstance(config?: Partial<TelescopeConfig>): Telescope {
    if (!Telescope.instance) {
      Telescope.instance = new Telescope(config);
    }
    return Telescope.instance;
  }

  // ============ CREATE OPERATIONS ============

  /**
   * Record incoming request (parent entry)
   * Returns the request ID for use as parent_id in child entries
   */
  public async recordIncomingRequest(
    data: Omit<IncomingRequestEntry, 'id' | 'type' | 'timestamp' | 'created_at'>,
    customId?: string
  ): Promise<string> {
    if (!this.isWatcherEnabled(EntryType.INCOMING_REQUEST)) {
      return '';
    }

    const requestId = customId || generateId();
    const entry: IncomingRequestEntry = {
      id: requestId,
      type: EntryType.INCOMING_REQUEST,
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
      ...data
    };

    await this.repository.create(entry);
    return requestId;
  }

  /**
   * Record outgoing request (child entry)
   * Must have parent_id (incoming request)
   */
  public async recordOutgoingRequest(
    data: Omit<OutgoingRequestEntry, 'id' | 'type' | 'timestamp' | 'created_at'>
  ): Promise<string> {
    if (!this.isWatcherEnabled(EntryType.OUTGOING_REQUEST)) {
      return '';
    }

    const entry: OutgoingRequestEntry = {
      id: generateId(),
      type: EntryType.OUTGOING_REQUEST,
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
      ...data
    };

    return this.repository.create(entry);
  }

  /**
   * Record exception (child entry, optional parent)
   */
  public async recordException(
    data: Omit<ExceptionEntryData, 'id' | 'type' | 'timestamp' | 'created_at'>
  ): Promise<string> {
    if (!this.isWatcherEnabled(EntryType.EXCEPTION)) {
      return '';
    }

    const entry: ExceptionEntryData = {
      id: generateId(),
      type: EntryType.EXCEPTION,
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
      ...data
    };

    return this.repository.create(entry);
  }

  /**
   * Record log (child entry, optional parent)
   */
  public async recordLog(
    data: Omit<LogEntryData, 'id' | 'type' | 'timestamp' | 'created_at'>
  ): Promise<string> {
    if (!this.isWatcherEnabled(EntryType.LOG)) {
      return '';
    }

    const entry: LogEntryData = {
      id: generateId(),
      type: EntryType.LOG,
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
      ...data
    };

    return this.repository.create(entry);
  }

  /**
   * Record query (child entry, optional parent)
   */
  public async recordQuery(
    data: Omit<QueryEntryData, 'id' | 'type' | 'timestamp' | 'created_at'>
  ): Promise<string> {
    if (!this.isWatcherEnabled(EntryType.QUERY)) {
      return '';
    }

    const entry: QueryEntryData = {
      id: generateId(),
      type: EntryType.QUERY,
      timestamp: Date.now(),
      created_at: new Date().toISOString(),
      ...data
    };

    return this.repository.create(entry);
  }

  // ============ READ OPERATIONS ============

  /**
   * Get all logs
   */
  public async getAllLogs(limit?: number): Promise<LogEntryData[]> {
    const entries = await this.repository.findByType(EntryType.LOG, limit);
    return entries as LogEntryData[];
  }

  /**
   * Get all queries
   */
  public async getAllQueries(limit?: number): Promise<QueryEntryData[]> {
    const entries = await this.repository.findByType(EntryType.QUERY, limit);
    return entries as QueryEntryData[];
  }

  /**
   * Get all incoming requests
   */
  public async getAllIncomingRequests(limit?: number): Promise<IncomingRequestEntry[]> {
    const entries = await this.repository.findByType(EntryType.INCOMING_REQUEST, limit);
    return entries as IncomingRequestEntry[];
  }

  /**
   * Get all outgoing requests
   */
  public async getAllOutgoingRequests(limit?: number): Promise<OutgoingRequestEntry[]> {
    const entries = await this.repository.findByType(EntryType.OUTGOING_REQUEST, limit);
    return entries as OutgoingRequestEntry[];
  }

  /**
   * Get all exceptions
   */
  public async getAllExceptions(limit?: number): Promise<ExceptionEntryData[]> {
    const entries = await this.repository.findByType(EntryType.EXCEPTION, limit);
    return entries as ExceptionEntryData[];
  }

  /**
   * Get single entry by ID
   */
  public async getEntry(id: string): Promise<TelescopeEntry | null> {
    return this.repository.findById(id);
  }

  /**
   * Get log by ID
   */
  public async getLog(id: string): Promise<LogEntryData | null> {
    const entry = await this.repository.findById(id);
    return entry && entry.type === EntryType.LOG ? (entry as LogEntryData) : null;
  }

  /**
   * Get query by ID
   */
  public async getQuery(id: string): Promise<QueryEntryData | null> {
    const entry = await this.repository.findById(id);
    return entry && entry.type === EntryType.QUERY ? (entry as QueryEntryData) : null;
  }

  /**
   * Get incoming request by ID
   */
  public async getIncomingRequest(id: string): Promise<IncomingRequestEntry | null> {
    const entry = await this.repository.findById(id);
    return entry && entry.type === EntryType.INCOMING_REQUEST ? (entry as IncomingRequestEntry) : null;
  }

  /**
   * Get outgoing request by ID
   */
  public async getOutgoingRequest(id: string): Promise<OutgoingRequestEntry | null> {
    const entry = await this.repository.findById(id);
    return entry && entry.type === EntryType.OUTGOING_REQUEST ? (entry as OutgoingRequestEntry) : null;
  }

  /**
   * Get exception by ID
   */
  public async getException(id: string): Promise<ExceptionEntryData | null> {
    const entry = await this.repository.findById(id);
    return entry && entry.type === EntryType.EXCEPTION ? (entry as ExceptionEntryData) : null;
  }

  /**
   * Get incoming request with all its children (One-to-Many)
   */
  public async getIncomingRequestWithChildren(
    requestId: string
  ): Promise<{ parent: IncomingRequestEntry; children: TelescopeEntry[] } | null> {
    return this.repository.findIncomingWithChildren(requestId);
  }

  /**
   * Get child logs of a request
   */
  public async getRequestLogs(requestId: string, limit?: number): Promise<LogEntryData[]> {
    const children = await this.repository.findByParentId(requestId, limit);
    return children.filter(e => e.type === EntryType.LOG) as LogEntryData[];
  }

  /**
   * Get child queries of a request
   */
  public async getRequestQueries(requestId: string, limit?: number): Promise<QueryEntryData[]> {
    const children = await this.repository.findByParentId(requestId, limit);
    return children.filter(e => e.type === EntryType.QUERY) as QueryEntryData[];
  }

  /**
   * Get child exceptions of a request
   */
  public async getRequestExceptions(requestId: string, limit?: number): Promise<ExceptionEntryData[]> {
    const children = await this.repository.findByParentId(requestId, limit);
    return children.filter(e => e.type === EntryType.EXCEPTION) as ExceptionEntryData[];
  }

  /**
   * Get child outgoing requests of a request
   */
  public async getRequestOutgoingRequests(requestId: string, limit?: number): Promise<OutgoingRequestEntry[]> {
    const children = await this.repository.findByParentId(requestId, limit);
    return children.filter(e => e.type === EntryType.OUTGOING_REQUEST) as OutgoingRequestEntry[];
  }

  // ============ UTILITY OPERATIONS ============

  /**
   * Get entry count (optional filter by type)
   */
  public async getEntriesCount(type?: EntryType): Promise<number> {
    return this.repository.count(type);
  }

  /**
   * Clear all entries
   */
  public async clearEntries(): Promise<void> {
    return this.repository.clear();
  }

  /**
   * Delete entries older than timestamp
   */
  public async deleteOldEntries(beforeTimestamp: number): Promise<number> {
    return this.repository.deleteOldEntries(beforeTimestamp);
  }

  // ============ CONFIG MANAGEMENT ============

  public getConfig(): TelescopeConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<TelescopeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============ PRIVATE HELPERS ============

  private isWatcherEnabled(type: EntryType): boolean {
    return this.config.enabled && (this.config.watchers?.[type] ?? false);
  }

  public shouldIgnore(path: string): boolean {
    return some(this.config.ignore_paths, ignorePath => 
      path.startsWith(ignorePath)
    ) || false;
  }
}