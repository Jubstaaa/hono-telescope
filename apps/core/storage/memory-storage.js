import { find, filter, forEach } from 'lodash';
class BaseRepository {
    entries = [];
    maxEntries;
    constructor(maxEntries = 1000) {
        this.maxEntries = maxEntries;
    }
    trimIfNeeded() {
        if (this.entries.length > this.maxEntries) {
            this.entries.splice(0, this.entries.length - this.maxEntries);
        }
    }
    async create(entry) {
        this.entries.push(entry);
        this.trimIfNeeded();
        return entry.id;
    }
    async findAll() {
        return this.entries;
    }
    async findById(id) {
        return find(this.entries, (e) => e.id === id) || null;
    }
    async findByParentId(parentId) {
        return filter(this.entries, (e) => e.parent_id === parentId);
    }
    async count() {
        return this.entries.length;
    }
}
export class IncomingRequestRepository extends BaseRepository {
}
export class OutgoingRequestRepository extends BaseRepository {
}
export class ExceptionRepository extends BaseRepository {
}
export class LogRepository extends BaseRepository {
}
export class QueryRepository extends BaseRepository {
}
export class MemoryStorage {
    incomingRequests = new IncomingRequestRepository();
    outgoingRequests = new OutgoingRequestRepository();
    exceptions = new ExceptionRepository();
    logs = new LogRepository();
    queries = new QueryRepository();
    constructor(maxEntries = 1000) {
        const repos = [
            this.incomingRequests,
            this.outgoingRequests,
            this.exceptions,
            this.logs,
            this.queries
        ];
        forEach(repos, repo => {
            repo.maxEntries = maxEntries;
        });
    }
}
