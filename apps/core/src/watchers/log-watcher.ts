import { Telescope } from '../telescope';
import { LogLevel } from '@hono-telescope/types';
import { ContextManager } from '../context-manager';
import { isObject, map } from 'lodash';

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
      debug: console.debug,
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
    console.log = (...args: unknown[]) => {
      this.originalConsole.log.apply(console, args);
      this.recordLog(LogLevel.INFO, args);
    };
  }

  private interceptConsoleWarn(): void {
    console.warn = (...args: unknown[]) => {
      this.originalConsole.warn.apply(console, args);
      this.recordLog(LogLevel.WARNING, args);
    };
  }

  private interceptConsoleError(): void {
    console.error = (...args: unknown[]) => {
      this.originalConsole.error.apply(console, args);
      this.recordLog(LogLevel.ERROR, args);
    };
  }

  private interceptConsoleInfo(): void {
    console.info = (...args: unknown[]) => {
      this.originalConsole.info.apply(console, args);
      this.recordLog(LogLevel.INFO, args);
    };
  }

  private interceptConsoleDebug(): void {
    console.debug = (...args: unknown[]) => {
      this.originalConsole.debug.apply(console, args);
      this.recordLog(LogLevel.DEBUG, args);
    };
  }

  private async recordLog(level: LogLevel, args: unknown[]): Promise<void> {
    const message = map(args, (arg) =>
      isObject(arg) ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const requestId = this.contextManager.getCurrentRequestId();

    await this.telescope.recordLog({
      level,
      message,
      context: {
        args,
        timestamp: new Date().toISOString(),
        stack: this.getStackTrace(),
      },
      parent_id: requestId || undefined,
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
