import { 
  TelescopeConfig, 
  IncomingRequestEntry,
  OutgoingRequestEntry,
  ExceptionEntry,
  LogEntry,
  QueryEntry,
  IncomingRequestCreateInput,
  OutgoingRequestCreateInput,
  ExceptionCreateInput,
  LogCreateInput,
  QueryCreateInput,
  TelescopeCreateInput,
  TelescopeEntry,
  BaseEntry
} from '@hono-telescope/types';
import { MemoryStorage } from './storage/memory-storage';

export class Telescope {
  private static instance: Telescope;
  private repository: MemoryStorage;

  private constructor(config: Partial<TelescopeConfig> = {}) {

    this.repository = new MemoryStorage(config.max_entries);
  }

  public static getInstance(config?: Partial<TelescopeConfig>): Telescope {
    if (!Telescope.instance) {
      Telescope.instance = new Telescope(config);
    }
    return Telescope.instance;
  }

  private createEntry<T extends TelescopeCreateInput>(
    data: T
  ): T & BaseEntry {
    return {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      created_at: new Date().toISOString()
    };
  }

  public async recordIncomingRequest(
    data: IncomingRequestCreateInput,
    customId?: string
  ): Promise<string> {
    
    const entry = this.createEntry<IncomingRequestCreateInput>(data);
    if (customId) entry.id = customId;
    
    return await this.repository.incomingRequests.create(entry);
  }

  public async getIncomingRequest(id: string): Promise<IncomingRequestEntry | null> {
    return this.repository.incomingRequests.findById(id);
  }

  public async getAllIncomingRequests(): Promise<IncomingRequestEntry[]> {
    const entries = await this.repository.incomingRequests.findAll();
    return entries as IncomingRequestEntry[];
  }

  public async recordOutgoingRequest(
    data: OutgoingRequestCreateInput
  ): Promise<string> {
    const entry = this.createEntry(data);
    return await this.repository.outgoingRequests.create(entry as OutgoingRequestEntry);
  }

  public async getOutgoingRequest(id: string): Promise<OutgoingRequestEntry | null> {
    return this.repository.outgoingRequests.findById(id);
  }

  public async getOutgoingRequestsByParentId(parentId: string): Promise<OutgoingRequestEntry[]> {
    return this.repository.outgoingRequests.findByParentId(parentId);
  }

  public async getAllOutgoingRequests(): Promise<OutgoingRequestEntry[]> {
    const entries = await this.repository.outgoingRequests.findAll();
    return entries as OutgoingRequestEntry[];
  }

  public async recordException(
    data: ExceptionCreateInput
  ): Promise<string> {
    const entry = this.createEntry(data);
    return await this.repository.exceptions.create(entry as ExceptionEntry);
  }

  public async getException(id: string): Promise<ExceptionEntry | null> {
    return this.repository.exceptions.findById(id);
  }

  public async getExceptionsByParentId(parentId: string): Promise<ExceptionEntry[]> {
    return this.repository.exceptions.findByParentId(parentId);
  }

  public async getAllExceptions(): Promise<ExceptionEntry[]> {
    const entries = await this.repository.exceptions.findAll();
    return entries as ExceptionEntry[];
  }

  public async recordLog(
    data: LogCreateInput
  ): Promise<string> {
    const entry = this.createEntry(data);
    return await this.repository.logs.create(entry as LogEntry);
  }

  public async getLog(id: string): Promise<LogEntry | null> {
    return this.repository.logs.findById(id);
  }

  public async getLogsByParentId(parentId: string): Promise<LogEntry[]> {
    return this.repository.logs.findByParentId(parentId);
  }

  public async getAllLogs(): Promise<LogEntry[]> {
    const entries = await this.repository.logs.findAll();
    return entries;
  }

  public async recordQuery(
    data: QueryCreateInput
  ): Promise<string> {
    const entry = this.createEntry(data);
    return await this.repository.queries.create(entry as QueryEntry);
  }

  public async getQuery(id: string): Promise<QueryEntry | null> {
    return this.repository.queries.findById(id);
  }

  public async getQueriesByParentId(parentId: string): Promise<QueryEntry[]> {
    return this.repository.queries.findByParentId(parentId);
  }

  public async getAllQueries(): Promise<QueryEntry[]> {
    const entries = await this.repository.queries.findAll();
    return entries as QueryEntry[];
  }

  public async countIncomingRequests(): Promise<number> {
    return this.repository.incomingRequests.count();
  }

  public async countOutgoingRequests(): Promise<number> {
    return this.repository.outgoingRequests.count();
  }

  public async countExceptions(): Promise<number> {
    return this.repository.exceptions.count();
  }

  public async countLogs(): Promise<number> {
    return this.repository.logs.count();
  }

  public async countQueries(): Promise<number> {
    return this.repository.queries.count();
  }

}