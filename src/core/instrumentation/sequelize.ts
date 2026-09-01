import type { Recorder } from '../recorder';

const START = Symbol('hono-telescope.start');

interface SequelizeQuery {
  sql?: string;
}

interface TimedOptions {
  [START]?: number;
}

interface SequelizeHookable {
  addHook(name: string, handler: (options: unknown, query: SequelizeQuery) => void): unknown;
}

export function instrumentSequelize<T>(sequelize: T, recorder: Recorder): T {
  const hookable = sequelize as SequelizeHookable;

  hookable.addHook('beforeQuery', (options) => {
    if (options !== null && typeof options === 'object') {
      (options as TimedOptions)[START] = Date.now();
    }
  });

  hookable.addHook('afterQuery', (options, query) => {
    const sql = query?.sql;
    if (!sql) return;

    const startTime =
      options !== null && typeof options === 'object'
        ? (options as TimedOptions)[START]
        : undefined;

    void recorder
      .recordQuery({
        connection: 'sequelize',
        query: sql,
        bindings: [],
        time: startTime === undefined ? 0 : Date.now() - startTime,
      })
      .catch(() => undefined);
  });

  return sequelize;
}
