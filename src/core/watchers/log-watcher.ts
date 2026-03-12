import { Telescope } from '../telescope';
import type { LogLevel } from '@/types';
import { ContextManager } from '../context-manager';

export class LogWatcher {
  private telescope: Telescope;
  private contextManager: ContextManager;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
    debug: typeof console.debug;
  } | null = null;

  constructor() {
    this.telescope = Telescope.getInstance();
    this.contextManager = ContextManager.getInstance();
  }

  public start(): void {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    this.interceptConsole('log', 1);
    this.interceptConsole('warn', 3);
    this.interceptConsole('error', 4);
    this.interceptConsole('info', 1);
    this.interceptConsole('debug', 0);
  }

  public stop(): void {
    if (!this.originalConsole) return;

    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
    this.originalConsole = null;
  }

  private interceptConsole(
    method: 'log' | 'warn' | 'error' | 'info' | 'debug',
    level: LogLevel
  ): void {
    const previous = console[method];
    const recordLog = this.recordLog.bind(this);

    console[method] = (...args: unknown[]) => {
      previous.apply(console, args);
      recordLog(level, args);
    };
  }

  private async recordLog(level: LogLevel, args: unknown[]): Promise<void> {
    const message = args
      .map((arg) =>
        typeof arg === 'object' && arg !== null ? JSON.stringify(arg, null, 2) : String(arg)
      )
      .join(' ');

    const requestId = this.contextManager.getCurrentRequestId();

    await this.telescope.recordLog({
      level,
      message,
      context: {
        args,
        timestamp: new Date().toISOString(),
        stack: this.getStackTrace(),
      },
      parent_id: requestId,
    });
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3).join('\n') : '';
  }
}

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
