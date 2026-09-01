import type { Recorder } from '../recorder';

type Statement = Record<string, unknown> & { sql?: string };

const WRAPPED_METHODS = ['all', 'get', 'run', 'values'] as const;

export function instrumentBunSqlite<T>(db: T, recorder: Recorder): T {
  const database = db as {
    query?: (sql: string) => Statement;
    prepare?: (sql: string) => Statement;
  };

  for (const factory of ['query', 'prepare'] as const) {
    const original = database[factory];
    if (typeof original !== 'function') continue;

    database[factory] = function wrapped(sql: string): Statement {
      const statement = original.call(database, sql);

      for (const method of WRAPPED_METHODS) {
        const originalMethod = statement[method];
        if (typeof originalMethod !== 'function') continue;

        statement[method] = function timed(...bindings: unknown[]) {
          const startTime = Date.now();

          try {
            return (originalMethod as (...args: unknown[]) => unknown).apply(statement, bindings);
          } finally {
            void recorder
              .recordQuery({
                connection: 'bun:sqlite',
                query: sql,
                bindings: bindings.map((binding) => String(binding)),
                time: Date.now() - startTime,
              })
              .catch(() => undefined);
          }
        };
      }

      return statement;
    };
  }

  return db;
}
