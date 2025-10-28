import { Telescope } from '../telescope';
import { EntryType, LogEntry } from '../types';
import { ContextManager } from '../context-manager';
import { map } from 'lodash';

export class LogWatcher {
  private telescope: Telescope;
  private contextManager: ContextManager;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
    debug: typeof console.debug;
  };

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

  public start(): void {
    this.interceptConsoleLog();
    this.interceptConsoleWarn();
    this.interceptConsoleError();
    this.interceptConsoleInfo();
    this.interceptConsoleDebug();
  }

  public stop(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }

  private interceptConsoleLog(): void {
    console.log = (...args: any[]) => {
      this.originalConsole.log.apply(console, args);
      this.recordLog('info', args);
    };
  }

  private interceptConsoleWarn(): void {
    console.warn = (...args: any[]) => {
      this.originalConsole.warn.apply(console, args);
      this.recordLog('warning', args);
    };
  }

  private interceptConsoleError(): void {
    console.error = (...args: any[]) => {
      this.originalConsole.error.apply(console, args);
      this.recordLog('error', args);
    };
  }

  private interceptConsoleInfo(): void {
    console.info = (...args: any[]) => {
      this.originalConsole.info.apply(console, args);
      this.recordLog('info', args);
    };
  }

  private interceptConsoleDebug(): void {
    console.debug = (...args: any[]) => {
      this.originalConsole.debug.apply(console, args);
      this.recordLog('debug', args);
    };
  }

  private async recordLog(level: string, args: any[]): Promise<void> {
    const message = map(args, arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const logEntry: LogEntry = {
      level,
      message,
      context: {
        args,
        timestamp: new Date().toISOString(),
        stack: this.getStackTrace()
      }
    };

    // Get current request context
    const requestId = this.contextManager.getCurrentRequestId();

    await this.telescope.record(EntryType.LOG, logEntry, [
      `level:${level}`,
      `length:${message.length}`
    ], undefined, requestId);
  }

  private getStackTrace(): string[] {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3) : []; // Remove first 3 lines
  }
}

// Global log watcher instance
let globalLogWatcher: LogWatcher | null = null;

export function startLogWatcher(): void {
  if (!globalLogWatcher) {
    globalLogWatcher = new LogWatcher();
    globalLogWatcher.start();
  }
}

export function stopLogWatcher(): void {
  if (globalLogWatcher) {
    globalLogWatcher.stop();
    globalLogWatcher = null;
  }
}