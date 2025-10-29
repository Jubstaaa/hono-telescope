import { Telescope } from '../telescope';
import { ContextManager } from '../context-manager';
import { getExceptionClassCode } from '../utils/helpers';
class ExceptionWatcher {
    originalConsoleError;
    contextManager;
    isWatching = false;
    constructor() {
        this.originalConsoleError = console.error;
        this.contextManager = ContextManager.getInstance();
    }
    start() {
        if (this.isWatching)
            return;
        this.isWatching = true;
        console.error = (...args) => {
            this.originalConsoleError.apply(console, args);
            this.recordException(new Error(args.join(' ')));
        };
        if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                this.recordException(error);
            });
            process.on('unhandledRejection', (reason) => {
                const error = reason instanceof Error ? reason : new Error(String(reason));
                this.recordException(error);
            });
        }
    }
    stop() {
        if (!this.isWatching)
            return;
        this.isWatching = false;
        console.error = this.originalConsoleError;
        if (typeof process !== 'undefined') {
            process.removeAllListeners('uncaughtException');
            process.removeAllListeners('unhandledRejection');
        }
    }
    recordException(error) {
        const telescope = Telescope.getInstance();
        const stack = error.stack || '';
        const requestId = this.contextManager.getCurrentRequestId();
        telescope.recordException({
            class: getExceptionClassCode(error.constructor.name),
            message: error.message,
            trace: stack.split('\n').slice(1).join('\n').trim(),
            parent_id: requestId || undefined
        });
    }
}
let watcher = null;
export function startExceptionWatcher() {
    if (!watcher) {
        watcher = new ExceptionWatcher();
    }
    watcher.start();
}
export function stopExceptionWatcher() {
    if (watcher) {
        watcher.stop();
    }
}
