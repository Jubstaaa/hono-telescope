import { Telescope } from '../telescope';
import { EntryType } from '../types';
import { ContextManager } from '../context-manager';
import { map } from 'lodash';

class ExceptionWatcher {
  private originalConsoleError: typeof console.error;
  private contextManager: ContextManager;
  private isWatching = false;

  constructor() {
    this.originalConsoleError = console.error;
    this.contextManager = ContextManager.getInstance();
  }

  start() {
    if (this.isWatching) return;
    
    this.isWatching = true;

    // Override console.error
    console.error = (...args: any[]) => {
      this.originalConsoleError.apply(console, args);
      this.recordException(new Error(args.join(' ')));
    };

    // Handle uncaught exceptions
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error: Error) => {
        this.recordException(error);
      });

      process.on('unhandledRejection', (reason: any) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        this.recordException(error);
      });
    }
  }

  stop() {
    if (!this.isWatching) return;
    
    this.isWatching = false;
    console.error = this.originalConsoleError;
    
    if (typeof process !== 'undefined') {
      process.removeAllListeners('uncaughtException');
      process.removeAllListeners('unhandledRejection');
    }
  }

  private recordException(error: Error) {
    const telescope = Telescope.getInstance();
    
    if (!telescope.getConfig().enabled) return;

    const stack = error.stack || '';
    const { file, line } = this.extractFileInfo(stack);

    // Get current request context
    const requestId = this.contextManager.getCurrentRequestId();

    telescope.record(EntryType.EXCEPTION, {
       class: error.constructor.name,
       file,
       line,
       message: error.message,
       trace: map(stack.split('\n').slice(1), line => line.trim())
     }, ['exception', error.constructor.name.toLowerCase()], undefined, requestId);
  }

  private extractFileInfo(stack: string): { file: string; line: number } {
    const lines = stack.split('\n');
    for (const line of lines) {
      const match = line.match(/at .* \((.+):(\d+):\d+\)/);
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2], 10)
        };
      }
    }
    return { file: 'unknown', line: 0 };
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