import { Telescope } from '../telescope';
import { ContextManager } from '../context-manager';
import { getExceptionClassCode } from '../utils/helpers';

class ExceptionWatcher {
  private originalConsoleError: typeof console.error;
  private contextManager: ContextManager;
  private isWatching = false;
  private uncaughtHandler: ((error: Error) => void) | null = null;
  private rejectionHandler: ((reason: unknown) => void) | null = null;

  constructor() {
    this.originalConsoleError = console.error;
    this.contextManager = ContextManager.getInstance();
  }

  start() {
    if (this.isWatching) return;

    this.isWatching = true;

    const previousConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      previousConsoleError.apply(console, args);
      this.recordException(new Error(args.join(' ')));
    };

    if (typeof process !== 'undefined') {
      this.uncaughtHandler = (error: Error) => {
        this.recordException(error);
      };

      this.rejectionHandler = (reason: unknown) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        this.recordException(error);
      };

      process.on('uncaughtException', this.uncaughtHandler);
      process.on('unhandledRejection', this.rejectionHandler);
    }
  }

  stop() {
    if (!this.isWatching) return;

    this.isWatching = false;
    console.error = this.originalConsoleError;

    if (typeof process !== 'undefined') {
      if (this.uncaughtHandler) {
        process.removeListener('uncaughtException', this.uncaughtHandler);
        this.uncaughtHandler = null;
      }
      if (this.rejectionHandler) {
        process.removeListener('unhandledRejection', this.rejectionHandler);
        this.rejectionHandler = null;
      }
    }
  }

  private recordException(error: Error) {
    const telescope = Telescope.getInstance();
    const stack = error.stack || '';
    const requestId = this.contextManager.getCurrentRequestId();

    telescope.recordException({
      class: getExceptionClassCode(error.constructor.name),
      message: error.message,
      trace: stack.split('\n').slice(1).join('\n').trim(),
      parent_id: requestId,
    });
  }
}

let watcher: ExceptionWatcher | null = null;

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
