import { LogLevel } from '../../types/index.js';
import type { Recorder } from '../recorder.js';
import type { Collector } from './collector.js';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const LEVELS: Record<ConsoleMethod, LogLevel> = {
  log: LogLevel.INFO,
  info: LogLevel.INFO,
  warn: LogLevel.WARNING,
  error: LogLevel.ERROR,
  debug: LogLevel.DEBUG,
};

function format(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg !== 'object' || arg === null) return String(arg);
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

export function consoleCollector(): Collector {
  let installed = false;
  let uninstall = () => {};

  return {
    name: 'console',

    install(recorder: Recorder) {
      if (installed) return uninstall;
      installed = true;

      const originals = {} as Record<ConsoleMethod, (...args: unknown[]) => void>;
      let recording = false;

      for (const method of Object.keys(LEVELS) as ConsoleMethod[]) {
        originals[method] = console[method] as (...args: unknown[]) => void;

        console[method] = (...args: unknown[]) => {
          originals[method].apply(console, args);

          if (recording) return;
          recording = true;

          try {
            void recorder
              .record('log', { level: LEVELS[method], message: format(args) })
              .catch(() => undefined);
          } finally {
            recording = false;
          }
        };
      }

      uninstall = () => {
        if (!installed) return;
        installed = false;

        for (const method of Object.keys(LEVELS) as ConsoleMethod[]) {
          console[method] = originals[method];
        }
      };

      return uninstall;
    },
  };
}
