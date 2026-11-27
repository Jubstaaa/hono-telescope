import type { Recorder } from '../recorder.js'
import type { Collector } from './collector.js'

import { getExceptionClassCode } from '../exception-class.js'

const telescopeListeners = new WeakSet<(...args: never[]) => unknown>()

const SURVIVING_MODE =
    /--unhandled-rejections[= ](warn|none|warn-with-error-code)\b/

export function exceptionCollector(): Collector {
    let installed = false
    let uninstall = () => {}

    return {
        install(recorder: Recorder) {
            if (installed) return uninstall
            installed = true

            const record = (error: Error) => {
                void recorder
                    .record('exception', {
                        class: getExceptionClassCode(error.constructor.name),
                        message: error.message,
                        trace: error.stack ?? '',
                    })
                    .catch(() => undefined)
            }

            let reraised: unknown
            const onUncaught = (error: unknown) => {
                if (error === reraised) return
                record(
                    error instanceof Error ? error : new Error(String(error))
                )
            }

            const onRejection = (reason: unknown) => {
                record(
                    reason instanceof Error ? reason : new Error(String(reason))
                )

                const [first] = process.listeners('unhandledRejection')
                if (first === onRejection && rejectionIsFatal()) {
                    reraised = reason
                    throw reason
                }
            }
            telescopeListeners.add(onRejection)

            process.on('uncaughtExceptionMonitor', onUncaught)
            process.on('unhandledRejection', onRejection)

            uninstall = () => {
                if (!installed) return
                installed = false

                process.removeListener('uncaughtExceptionMonitor', onUncaught)
                process.removeListener('unhandledRejection', onRejection)
            }

            return uninstall
        },

        name: 'exception',
    }
}

function rejectionIsFatal(): boolean {
    const flags = [...process.execArgv, process.env.NODE_OPTIONS ?? ''].join(
        ' '
    )
    if (SURVIVING_MODE.test(flags)) return false

    return process
        .listeners('unhandledRejection')
        .every(listener => telescopeListeners.has(listener))
}
