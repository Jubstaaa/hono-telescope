import { Telescope } from '../telescope';
import { LogLevel } from '@hono-telescope/types';
import { ContextManager } from '../context-manager';
import { map } from 'lodash';
export class LogWatcher {
    telescope;
    contextManager;
    originalConsole;
    constructor() {
        this.telescope = Telescope.getInstance();
        this.contextManager = ContextManager.getInstance();
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
        };
    }
    start() {
        this.interceptConsoleLog();
        this.interceptConsoleWarn();
        this.interceptConsoleError();
        this.interceptConsoleInfo();
        this.interceptConsoleDebug();
    }
    stop() {
        console.log = this.originalConsole.log;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
        console.info = this.originalConsole.info;
        console.debug = this.originalConsole.debug;
    }
    interceptConsoleLog() {
        console.log = (...args) => {
            this.originalConsole.log.apply(console, args);
            this.recordLog(LogLevel.INFO, args);
        };
    }
    interceptConsoleWarn() {
        console.warn = (...args) => {
            this.originalConsole.warn.apply(console, args);
            this.recordLog(LogLevel.WARNING, args);
        };
    }
    interceptConsoleError() {
        console.error = (...args) => {
            this.originalConsole.error.apply(console, args);
            this.recordLog(LogLevel.ERROR, args);
        };
    }
    interceptConsoleInfo() {
        console.info = (...args) => {
            this.originalConsole.info.apply(console, args);
            this.recordLog(LogLevel.INFO, args);
        };
    }
    interceptConsoleDebug() {
        console.debug = (...args) => {
            this.originalConsole.debug.apply(console, args);
            this.recordLog(LogLevel.DEBUG, args);
        };
    }
    async recordLog(level, args) {
        const message = map(args, arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
        const requestId = this.contextManager.getCurrentRequestId();
        await this.telescope.recordLog({
            level,
            message,
            context: {
                args,
                timestamp: new Date().toISOString(),
                stack: this.getStackTrace()
            },
            parent_id: requestId || undefined
        });
    }
    getStackTrace() {
        const stack = new Error().stack;
        return stack ? stack.split('\n').slice(3).join('\n') : '';
    }
}
let globalLogWatcher = null;
export function startLogWatcher() {
    if (!globalLogWatcher) {
        globalLogWatcher = new LogWatcher();
        globalLogWatcher.start();
    }
}
export function stopLogWatcher() {
    if (globalLogWatcher) {
        globalLogWatcher.stop();
        globalLogWatcher = null;
    }
}
