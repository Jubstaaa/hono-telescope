import type { Recorder } from '../recorder.js'
import type { Collector } from './collector.js'

import { LogLevel } from '../entries.js'

type ConsoleMethod = 'debug' | 'error' | 'info' | 'log' | 'warn'

const LEVELS: Record<ConsoleMethod, LogLevel> = {
    debug: LogLevel.DEBUG,
    error: LogLevel.ERROR,
    info: LogLevel.INFO,
    log: LogLevel.INFO,
    warn: LogLevel.WARNING,
}

export function consoleCollector(): Collector {
    let installed = false
    let uninstall = () => {}

    return {
        install(recorder: Recorder) {
            if (installed) return uninstall
            installed = true

            const originals = {} as Record<
                ConsoleMethod,
                (...args: unknown[]) => void
            >
            let recording = false

            for (const method of Object.keys(LEVELS) as ConsoleMethod[]) {
                // eslint-disable-next-line @typescript-eslint/unbound-method -- saving the original so it can be restored and called later is the point
                originals[method] = console[method] as (
                    ...args: unknown[]
                ) => void

                console[method] = (...args: unknown[]) => {
                    originals[method].apply(console, args)

                    if (recording) return
                    recording = true

                    try {
                        void recorder
                            .record('log', {
                                level: LEVELS[method],
                                message: format(args),
                            })
                            .catch(() => undefined)
                    } finally {
                        recording = false
                    }
                }
            }

            uninstall = () => {
                if (!installed) return
                installed = false

                for (const method of Object.keys(LEVELS) as ConsoleMethod[]) {
                    console[method] = originals[method]
                }
            }

            return uninstall
        },

        name: 'console',
    }
}

function format(args: unknown[]): string {
    return args
        .map(arg => {
            if (typeof arg !== 'object' || arg === null) return String(arg)
            try {
                return JSON.stringify(arg)
            } catch {
                return Object.prototype.toString.call(arg)
            }
        })
        .join(' ')
}
