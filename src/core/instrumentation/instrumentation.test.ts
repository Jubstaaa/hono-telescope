import { describe, expect, it, vi } from 'vitest';
import { instrumentPrisma } from './prisma.js';
import { instrumentSequelize } from './sequelize.js';
import { instrumentMongo } from './mongo.js';
import { instrumentBunSqlite } from './bun-sqlite.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';
import { alsContext } from '../context/als-context.js';

const build = () => {
  const storage = memoryStorage();
  return { storage, recorder: new Recorder(storage, alsContext()) };
};

describe('instrumentPrisma', () => {
  it('records the operation through $allOperations and returns the extended client', async () => {
    const { storage, recorder } = build();

    const extended = { marker: 'extended' };
    let captured: ((args: Record<string, unknown>) => Promise<unknown>) | undefined;

    const client = {
      $extends(extension: {
        query: { $allOperations: (args: Record<string, unknown>) => Promise<unknown> };
      }) {
        captured = extension.query.$allOperations;
        return extended;
      },
    };

    const result = instrumentPrisma(client, recorder);
    expect(result).toBe(extended);

    await captured!({
      model: 'User',
      operation: 'findMany',
      args: { where: { id: 1 } },
      query: async () => [{ id: 1 }],
    });

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    const [entry] = await storage.list('query');
    expect(entry).toMatchObject({ connection: 'prisma', query: 'User.findMany' });
    expect(typeof entry.time).toBe('number');
  });

  it('still resolves and records when args contain a BigInt that cannot be JSON.stringify-ed', async () => {
    const { storage, recorder } = build();

    let captured: ((args: Record<string, unknown>) => Promise<unknown>) | undefined;

    const client = {
      $extends(extension: {
        query: { $allOperations: (args: Record<string, unknown>) => Promise<unknown> };
      }) {
        captured = extension.query.$allOperations;
        return {};
      },
    };

    instrumentPrisma(client, recorder);

    const result = await captured!({
      model: 'User',
      operation: 'findMany',
      args: { where: { id: 5n } },
      query: async () => [{ id: 5n }],
    });

    expect(result).toEqual([{ id: 5n }]);

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    const [entry] = await storage.list('query');
    expect(entry.bindings).toEqual(['<unserializable>']);
  });

  it('still resolves and records when args are circular', async () => {
    const { storage, recorder } = build();

    let captured: ((args: Record<string, unknown>) => Promise<unknown>) | undefined;

    const client = {
      $extends(extension: {
        query: { $allOperations: (args: Record<string, unknown>) => Promise<unknown> };
      }) {
        captured = extension.query.$allOperations;
        return {};
      },
    };

    instrumentPrisma(client, recorder);

    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const result = await captured!({
      model: 'User',
      operation: 'findMany',
      args: circular,
      query: async () => [{ id: 1 }],
    });

    expect(result).toEqual([{ id: 1 }]);

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    const [entry] = await storage.list('query');
    expect(entry.bindings).toEqual(['<unserializable>']);
  });
});

describe('instrumentSequelize', () => {
  it('records a query from the afterQuery hook', async () => {
    const { storage, recorder } = build();
    const hooks: Record<string, (...args: unknown[]) => void> = {};

    const sequelize = {
      addHook(name: string, handler: (...args: unknown[]) => void) {
        hooks[name] = handler;
      },
    };

    expect(instrumentSequelize(sequelize, recorder)).toBe(sequelize);

    const options = {};
    hooks.beforeQuery(options, { sql: 'SELECT 1' });
    hooks.afterQuery(options, { sql: 'SELECT 1' });

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    expect((await storage.list('query'))[0]).toMatchObject({
      connection: 'sequelize',
      query: 'SELECT 1',
    });
  });
});

describe('instrumentMongo', () => {
  it('records a succeeded command', async () => {
    const { storage, recorder } = build();
    const listeners: Record<string, (event: unknown) => void> = {};

    const client = {
      on(event: string, handler: (payload: unknown) => void) {
        listeners[event] = handler;
      },
    };

    expect(instrumentMongo(client, recorder)).toBe(client);

    listeners.commandSucceeded({
      commandName: 'find',
      databaseName: 'app',
      duration: 4,
      requestId: 1,
    });

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    expect((await storage.list('query'))[0]).toMatchObject({
      connection: 'mongodb',
      query: 'app.find',
      time: 4,
    });
  });
});

describe('instrumentBunSqlite', () => {
  it('records a query run through the wrapped instance', async () => {
    const { storage, recorder } = build();

    const db = {
      query(sql: string) {
        return { sql, all: () => [{ id: 1 }] };
      },
    };

    const wrapped = instrumentBunSqlite(db, recorder);
    const statement = (wrapped as typeof db).query('SELECT 1');
    statement.all();

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    expect((await storage.list('query'))[0]).toMatchObject({
      connection: 'bun:sqlite',
      query: 'SELECT 1',
    });
  });

  it('does not re-wrap a cached statement returned for the same SQL', async () => {
    const { storage, recorder } = build();
    const cache = new Map<string, { sql: string; all: () => unknown[] }>();

    const db = {
      query(sql: string) {
        const existing = cache.get(sql);
        if (existing) return existing;

        const statement = { sql, all: () => [{ id: 1 }] };
        cache.set(sql, statement);
        return statement;
      },
    };

    const wrapped = instrumentBunSqlite(db, recorder);
    (wrapped as typeof db).query('SELECT 1');
    const statement = (wrapped as typeof db).query('SELECT 1');
    statement.all();

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    expect(await storage.count('query')).toBe(1);
  });

  it('returns the query result when a binding cannot be stringified', async () => {
    const { storage, recorder } = build();
    const statement = { sql: 'SELECT ?', all: (...bindings: unknown[]) => bindings.length };
    const db = { query: () => statement };

    const wrapped = instrumentBunSqlite(db, recorder);
    const hostile = {
      toString() {
        throw new Error('cannot stringify');
      },
    };

    expect((wrapped as typeof db).query().all(hostile)).toBe(1);

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));
    expect((await storage.list('query'))[0].bindings).toEqual(['<unstringifiable>']);
  });
});

describe('failed queries', () => {
  it('marks a failed mongo command and keeps a succeeded one clean', async () => {
    const { storage, recorder } = build();
    const listeners: Record<string, (event: unknown) => void> = {};

    const client = {
      on(event: string, handler: (payload: unknown) => void) {
        listeners[event] = handler;
      },
    };

    instrumentMongo(client, recorder);

    listeners.commandSucceeded({ commandName: 'find', databaseName: 'app', duration: 4 });
    listeners.commandFailed({
      commandName: 'insert',
      databaseName: 'app',
      duration: 9,
      failure: new Error('E11000 duplicate key'),
    });

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(2));

    const [failed, succeeded] = await storage.list('query');
    expect(failed).toMatchObject({ query: 'app.insert', failed: true });
    expect(failed.error).toContain('E11000 duplicate key');
    expect(succeeded).toMatchObject({ query: 'app.find' });
    expect(succeeded.failed).toBeUndefined();
    expect(succeeded.error).toBeUndefined();
  });

  it('marks a throwing prisma operation as failed and still rethrows', async () => {
    const { storage, recorder } = build();
    let captured: ((args: Record<string, unknown>) => Promise<unknown>) | undefined;

    const client = {
      $extends(extension: {
        query: { $allOperations: (args: Record<string, unknown>) => Promise<unknown> };
      }) {
        captured = extension.query.$allOperations;
        return {};
      },
    };

    instrumentPrisma(client, recorder);

    await expect(
      captured!({
        model: 'User',
        operation: 'create',
        args: {},
        query: async () => {
          throw new Error('connection lost');
        },
      })
    ).rejects.toThrow('connection lost');

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    const [entry] = await storage.list('query');
    expect(entry).toMatchObject({ query: 'User.create', failed: true });
    expect(entry.error).toContain('connection lost');
  });

  it('marks a throwing bun:sqlite statement as failed and still rethrows', async () => {
    const { storage, recorder } = build();

    const db = {
      query(sql: string) {
        return {
          sql,
          all: () => {
            throw new Error('no such table: users');
          },
        };
      },
    };

    const wrapped = instrumentBunSqlite(db, recorder);
    const statement = (wrapped as typeof db).query('SELECT * FROM users');

    expect(() => statement.all()).toThrow('no such table: users');

    await vi.waitFor(async () => expect(await storage.count('query')).toBe(1));

    const [entry] = await storage.list('query');
    expect(entry).toMatchObject({ query: 'SELECT * FROM users', failed: true });
    expect(entry.error).toContain('no such table: users');
  });
});
