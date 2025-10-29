import { MemoryStorage } from './storage/memory-storage';
export class Telescope {
    static instance;
    repository;
    constructor(config = {}) {
        this.repository = new MemoryStorage(config.max_entries);
    }
    static getInstance(config) {
        if (!Telescope.instance) {
            Telescope.instance = new Telescope(config);
        }
        return Telescope.instance;
    }
    createEntry(data) {
        return {
            ...data,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            created_at: new Date().toISOString()
        };
    }
    async recordIncomingRequest(data, customId) {
        const entry = this.createEntry(data);
        if (customId)
            entry.id = customId;
        return await this.repository.incomingRequests.create(entry);
    }
    async getIncomingRequest(id) {
        return this.repository.incomingRequests.findById(id);
    }
    async getAllIncomingRequests() {
        const entries = await this.repository.incomingRequests.findAll();
        return entries;
    }
    async recordOutgoingRequest(data) {
        const entry = this.createEntry(data);
        return await this.repository.outgoingRequests.create(entry);
    }
    async getOutgoingRequest(id) {
        return this.repository.outgoingRequests.findById(id);
    }
    async getOutgoingRequestsByParentId(parentId) {
        return this.repository.outgoingRequests.findByParentId(parentId);
    }
    async getAllOutgoingRequests() {
        const entries = await this.repository.outgoingRequests.findAll();
        return entries;
    }
    async recordException(data) {
        const entry = this.createEntry(data);
        return await this.repository.exceptions.create(entry);
    }
    async getException(id) {
        return this.repository.exceptions.findById(id);
    }
    async getExceptionsByParentId(parentId) {
        return this.repository.exceptions.findByParentId(parentId);
    }
    async getAllExceptions() {
        const entries = await this.repository.exceptions.findAll();
        return entries;
    }
    async recordLog(data) {
        const entry = this.createEntry(data);
        return await this.repository.logs.create(entry);
    }
    async getLog(id) {
        return this.repository.logs.findById(id);
    }
    async getLogsByParentId(parentId) {
        return this.repository.logs.findByParentId(parentId);
    }
    async getAllLogs() {
        const entries = await this.repository.logs.findAll();
        return entries;
    }
    async recordQuery(data) {
        const entry = this.createEntry(data);
        return await this.repository.queries.create(entry);
    }
    async getQuery(id) {
        return this.repository.queries.findById(id);
    }
    async getQueriesByParentId(parentId) {
        return this.repository.queries.findByParentId(parentId);
    }
    async getAllQueries() {
        const entries = await this.repository.queries.findAll();
        return entries;
    }
    async countIncomingRequests() {
        return this.repository.incomingRequests.count();
    }
    async countOutgoingRequests() {
        return this.repository.outgoingRequests.count();
    }
    async countExceptions() {
        return this.repository.exceptions.count();
    }
    async countLogs() {
        return this.repository.logs.count();
    }
    async countQueries() {
        return this.repository.queries.count();
    }
}
