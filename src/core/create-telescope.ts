import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import type { ResolvedConfig, TelescopeConfig } from '@/types';
import { resolveConfig } from './config';
import { Recorder } from './recorder';
import { consoleCollector } from './collectors/console-collector';
import { exceptionCollector } from './collectors/exception-collector';
import { fetchCollector } from './collectors/fetch-collector';
import { createMiddleware } from './hono/middleware';
import { instrumentPrisma } from './instrumentation/prisma';
import { instrumentSequelize } from './instrumentation/sequelize';
import { instrumentMongo } from './instrumentation/mongo';
import { instrumentBunSqlite } from './instrumentation/bun-sqlite';

export interface Telescope {
  readonly recorder: Recorder;
  readonly config: ResolvedConfig;
  middleware(): MiddlewareHandler;
  dashboard(): Hono;
  instrumentPrisma<T>(client: T): T;
  instrumentSequelize<T>(sequelize: T): T;
  instrumentMongo<T>(client: T): T;
  instrumentBunSqlite<T>(db: T): T;
  /**
   * Uninstalls the collectors. It does not stop middleware recording —
   * a middleware already mounted keeps recording `incoming_request` entries after this call.
   */
  stop(): void;
}

const passThrough: MiddlewareHandler = async (_c, next) => {
  await next();
};

export function createTelescope(config: TelescopeConfig = {}): Telescope {
  const resolved = resolveConfig(config);
  const recorder = new Recorder(resolved.storage, resolved.context);

  const collectors = config.collectors ?? [
    consoleCollector(),
    exceptionCollector(),
    fetchCollector(),
  ];

  const uninstalls = resolved.enabled
    ? collectors.map((collector) => collector.install(recorder))
    : [];

  return {
    recorder,
    config: resolved,

    middleware() {
      return resolved.enabled ? createMiddleware(recorder, resolved) : passThrough;
    },

    dashboard() {
      return new Hono();
    },

    instrumentPrisma(client) {
      return resolved.enabled ? instrumentPrisma(client, recorder) : client;
    },

    instrumentSequelize(sequelize) {
      return resolved.enabled ? instrumentSequelize(sequelize, recorder) : sequelize;
    },

    instrumentMongo(client) {
      return resolved.enabled ? instrumentMongo(client, recorder) : client;
    },

    instrumentBunSqlite(db) {
      return resolved.enabled ? instrumentBunSqlite(db, recorder) : db;
    },

    stop() {
      while (uninstalls.length > 0) {
        uninstalls.pop()?.();
      }
    },
  };
}
