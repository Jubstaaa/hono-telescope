import { AsyncLocalStorage } from 'async_hooks';
export class ContextManager {
    static instance;
    asyncLocalStorage;
    constructor() {
        this.asyncLocalStorage = new AsyncLocalStorage();
    }
    static getInstance() {
        if (!ContextManager.instance) {
            ContextManager.instance = new ContextManager();
        }
        return ContextManager.instance;
    }
    run(context, callback) {
        return this.asyncLocalStorage.run(context, callback);
    }
    getCurrentContext() {
        return this.asyncLocalStorage.getStore();
    }
    getCurrentRequestId() {
        const context = this.getCurrentContext();
        return context?.requestId;
    }
}
