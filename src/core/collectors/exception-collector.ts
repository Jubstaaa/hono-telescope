import type { Recorder } from '../recorder.js';
import { getExceptionClassCode } from '../utils/helpers.js';

import type { Collector } from './collector.js';

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
        // 'uncaughtExceptionMonitor'). When Telescope's listener is the only one, the app has
        // not chosen to survive rejections, so restore the default: fatal.
        if (process.listenerCount('unhandledRejection') === 1) {
          reraised = reason;
          throw reason;
        }
      };

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
