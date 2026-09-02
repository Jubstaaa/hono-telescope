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

      const onUncaught = (error: Error) => record(error);
      const onRejection = (reason: unknown) =>
        record(reason instanceof Error ? reason : new Error(String(reason)));

      process.on('uncaughtException', onUncaught);
      process.on('unhandledRejection', onRejection);

      uninstall = () => {
        if (!installed) return;
        installed = false;

        process.removeListener('uncaughtException', onUncaught);
        process.removeListener('unhandledRejection', onRejection);
      };

      return uninstall;
    },

    name: 'exception',
  };
}
