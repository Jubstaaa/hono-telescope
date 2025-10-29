import { Telescope } from '../telescope';
import { some } from 'lodash';
import { ContextManager } from '../context-manager';
class QueryWatcher {
    isWatching = false;
    originalConsoleLog;
    constructor() {
        this.originalConsoleLog = console.log;
    }
    start() {
        if (this.isWatching)
            return;
        this.isWatching = true;
        console.log = (...args) => {
            this.originalConsoleLog.apply(console, args);
            const message = args.join(' ');
            if (this.isSQLQuery(message)) {
                this.recordQuery(message);
            }
        };
    }
    stop() {
        if (!this.isWatching)
            return;
        this.isWatching = false;
        console.log = this.originalConsoleLog;
    }
    isSQLQuery(message) {
        const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
        const upperMessage = message.toUpperCase();
        return some(sqlKeywords, keyword => upperMessage.includes(keyword));
    }
    recordQuery(sql) {
        const telescope = Telescope.getInstance();
        const contextManager = ContextManager.getInstance();
        const parentId = contextManager.getCurrentRequestId();
        telescope.recordQuery({
            connection: 'default',
            bindings: [],
            query: sql.trim(),
            time: 0,
            parent_id: parentId || undefined
        });
    }
}
let watcher = null;
export function startQueryWatcher() {
    if (!watcher) {
        watcher = new QueryWatcher();
    }
    watcher.start();
}
export function stopQueryWatcher() {
    if (watcher) {
        watcher.stop();
    }
}
export function recordDatabaseQuery(sql, connection = 'default', bindings = [], executionTime = 0) {
    const telescope = Telescope.getInstance();
    const contextManager = ContextManager.getInstance();
    const parentId = contextManager.getCurrentRequestId();
    telescope.recordQuery({
        connection,
        bindings,
        query: sql.trim(),
        time: executionTime,
        parent_id: parentId || undefined
    });
}
