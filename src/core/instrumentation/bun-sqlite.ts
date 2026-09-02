import type { Recorder } from '../recorder.js';

import { failureFields } from './failure.js';

type Statement = Record<string, unknown> & { sql?: string };

const WRAPPED_METHODS = ['all', 'get', 'run', 'values'] as const;
const WRAPPED = Symbol('hono-telescope.wrapped');

export function instrumentBunSqlite<T>(db: T, recorder: Recorder): T {
  const database = db as {
    prepare?: (sql: string) => Statement;
    query?: (sql: string) => Statement;
  };

  for (const factory of ['query', 'prepare'] as const) {
    const original = database[factory];
    if (typeof original !== 'function') continue;

    database[factory] = function wrapped(sql: string): Statement {
      const statement = original.call(database, sql);

      if ((statement as Record<PropertyKey, unknown>)[WRAPPED] === true) {
        return statement;
      }

      Object.defineProperty(statement, WRAPPED, {
        configurable: true,
        enumerable: false,
        value: true,
      });

      for (const method of WRAPPED_METHODS) {
        const originalMethod = statement[method];
        if (typeof originalMethod !== 'function') continue;

        statement[method] = function timed(...bindings: unknown[]) {
          const startTime = Date.now();

          let failure: unknown;

          try {
            return (originalMethod as (...args: unknown[]) => unknown).apply(statement, bindings);
          } catch (error) {
            failure = error ?? new Error('failed');
            throw error;
          } finally {
            let recorded: string[];
            try {
              recorded = bindings.map((binding) => String(binding));
            } catch {
              recorded = ['<unstringifiable>'];
            }

            void recorder
              .recordQuery({
                bindings: recorded,
                connection: 'bun:sqlite',
                query: sql,
                time: Date.now() - startTime,
                ...failureFields(failure),
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
