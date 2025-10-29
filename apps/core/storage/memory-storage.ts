import { IncomingRequestEntry, OutgoingRequestEntry,  BaseEntry, ExceptionEntry, LogEntry, QueryEntry } from '@hono-telescope/types';
import { find, filter, forEach } from 'lodash';


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
}

export class IncomingRequestRepository extends BaseRepository<IncomingRequestEntry> {}
export class OutgoingRequestRepository extends BaseRepository<OutgoingRequestEntry> {}
export class ExceptionRepository extends BaseRepository<ExceptionEntry> {}
export class LogRepository extends BaseRepository<LogEntry> {}
export class QueryRepository extends BaseRepository<QueryEntry> {}

export class MemoryStorage {
  readonly incomingRequests = new IncomingRequestRepository();
  readonly outgoingRequests = new OutgoingRequestRepository();
  readonly exceptions = new ExceptionRepository();
  readonly logs = new LogRepository();
  readonly queries = new QueryRepository();

  constructor(maxEntries: number = 1000) {
    const repos = [
      this.incomingRequests,
      this.outgoingRequests,
      this.exceptions,
      this.logs,
      this.queries
    ];
    forEach(repos, repo => {
      (repo as any).maxEntries = maxEntries;
    });
  }
}
