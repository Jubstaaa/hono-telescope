import { IncomingRequestEntry, OutgoingRequestEntry, BaseEntry, ExceptionEntry, LogEntry, QueryEntry } from '@hono-telescope/types';
declare class BaseRepository<T extends BaseEntry> {
    protected entries: T[];
    protected maxEntries: number;
    constructor(maxEntries?: number);
    protected trimIfNeeded(): void;
    create(entry: T): Promise<string>;
    findAll(): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    findByParentId(parentId: string): Promise<T[]>;
    count(): Promise<number>;
}
export declare class IncomingRequestRepository extends BaseRepository<IncomingRequestEntry> {
}
export declare class OutgoingRequestRepository extends BaseRepository<OutgoingRequestEntry> {
}
export declare class ExceptionRepository extends BaseRepository<ExceptionEntry> {
}
export declare class LogRepository extends BaseRepository<LogEntry> {
}
export declare class QueryRepository extends BaseRepository<QueryEntry> {
}
export declare class MemoryStorage {
    readonly incomingRequests: IncomingRequestRepository;
    readonly outgoingRequests: OutgoingRequestRepository;
    readonly exceptions: ExceptionRepository;
    readonly logs: LogRepository;
    readonly queries: QueryRepository;
    constructor(maxEntries?: number);
}
export {};
