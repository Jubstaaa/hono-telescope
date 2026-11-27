import type { Recorder } from '../recorder.js'

const START = Symbol('hono-telescope.start')

interface SequelizeHookable {
    addHook(
        name: string,
        handler: (options: unknown, query: SequelizeQuery) => void
    ): unknown
}

interface SequelizeQuery {
    sql?: string
}

interface TimedOptions {
    [START]?: number
}

export function instrumentSequelize<T>(sequelize: T, recorder: Recorder): T {
    const hookable = sequelize as SequelizeHookable

    hookable.addHook('beforeQuery', options => {
        if (options !== null && typeof options === 'object') {
            ;(options as TimedOptions)[START] = Date.now()
        }
    })

    hookable.addHook('afterQuery', (options, query) => {
        const sql: string | undefined = query.sql
        if (!sql) return

        const startTime =
            options !== null && typeof options === 'object'
                ? (options as TimedOptions)[START]
                : undefined

        void recorder
            .recordQuery({
                bindings: [],
                connection: 'sequelize',
                query: sql,
                time: startTime === undefined ? 0 : Date.now() - startTime,
            })
            .catch(() => undefined)
    })

    return sequelize
}
