import {
  IncomingRequestEntry,
  OutgoingRequestEntry,
  BaseEntry,
  ExceptionEntry,
  LogEntry,
  QueryEntry,
} from '@/types';
import { find, filter } from 'lodash';

class BaseRepository<T extends BaseEntry> {
  protected entries: T[] = [];
  protected maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  protected trimIfNeeded(): void {
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
  }

  async create(entry: T): Promise<string> {
    this.entries.push(entry);
    this.trimIfNeeded();
    return entry.id;
  }

  async findAll(): Promise<T[]> {
    return this.entries;
  }

  async findById(id: string): Promise<T | null> {
    return find(this.entries, (e) => e.id === id) || null;
  }

  async findByParentId(parentId: string): Promise<T[]> {
    return filter(this.entries, (e) => e.parent_id === parentId);
  }

  async count(): Promise<number> {
    return this.entries.length;
  }

  async clear(): Promise<void> {
    this.entries = [];
  }
}

export class IncomingRequestRepository extends BaseRepository<IncomingRequestEntry> {}
export class OutgoingRequestRepository extends BaseRepository<OutgoingRequestEntry> {}
export class ExceptionRepository extends BaseRepository<ExceptionEntry> {}
export class LogRepository extends BaseRepository<LogEntry> {}
export class QueryRepository extends BaseRepository<QueryEntry> {}

export class MemoryStorage {
  readonly incomingRequests: IncomingRequestRepository;
  readonly outgoingRequests: OutgoingRequestRepository;
  readonly exceptions: ExceptionRepository;
  readonly logs: LogRepository;
  readonly queries: QueryRepository;

  constructor(maxEntries: number = 1000) {
    this.incomingRequests = new IncomingRequestRepository(maxEntries);
    this.outgoingRequests = new OutgoingRequestRepository(maxEntries);
    this.exceptions = new ExceptionRepository(maxEntries);
    this.logs = new LogRepository(maxEntries);
    this.queries = new QueryRepository(maxEntries);
  }
}
