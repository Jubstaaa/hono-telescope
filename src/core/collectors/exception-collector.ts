import { getExceptionClassCode } from '../exception-class.js';
import type { Recorder } from '../recorder.js';

import type { Collector } from './collector.js';

// Every Telescope instance's rejection listener, so several instances (or a hot reload that
// left an old one behind) do not mistake each other for an app handler.
const telescopeListeners = new WeakSet<(...args: never[]) => unknown>();

const SURVIVING_MODE = /--unhandled-rejections[= ](warn|none|warn-with-error-code)\b/;

// Mirrors the runtime's default: fatal unless the app registered a handler of its own or
// chose a surviving --unhandled-rejections mode.
function rejectionIsFatal(): boolean {
  const flags = [...process.execArgv, process.env.NODE_OPTIONS ?? ''].join(' ');
  if (SURVIVING_MODE.test(flags)) return false;

  return process
    .listeners('unhandledRejection')
    .every((listener) => telescopeListeners.has(listener));
}

export function exceptionCollector(): Collector {
  let installed = false;
  let uninstall = () => {};

  return {
    install(recorder: Recorder) {
      if (installed) return uninstall;
      installed = true;

      const record = (error: Error) => {
        void recorder
          .record('exception', {
            class: getExceptionClassCode(error.constructor?.name ?? 'Error'),
            message: error.message,
            trace: error.stack ?? '',
          })
          .catch(() => undefined);
      };

      // A listener on 'uncaughtException' or 'unhandledRejection' switches off the runtime's
      // crash, so an app with Telescope enabled would keep running after a fatal error. The
      // monitor event observes without changing that.
      let reraised: unknown;
      const onUncaught = (error: unknown) => {
        if (error === reraised) return;
        record(error instanceof Error ? error : new Error(String(error)));
      };

      const onRejection = (reason: unknown) => {
        record(reason instanceof Error ? reason : new Error(String(reason)));

        // No monitor equivalent exists for rejections (Bun never routes them through
        // 'uncaughtExceptionMonitor'), so restore the default by re-raising. Only the first
        // Telescope listener does it; the others would never run anyway.
        const [first] = process.listeners('unhandledRejection');
        if (first === onRejection && rejectionIsFatal()) {
          reraised = reason;
          throw reason;
        }
      };
      telescopeListeners.add(onRejection);

      process.on('uncaughtExceptionMonitor', onUncaught);
      process.on('unhandledRejection', onRejection);

      uninstall = () => {
        if (!installed) return;
        installed = false;

        process.removeListener('uncaughtExceptionMonitor', onUncaught);
        process.removeListener('unhandledRejection', onRejection);
      };

      return uninstall;
    },

    name: 'exception',
  };
}
