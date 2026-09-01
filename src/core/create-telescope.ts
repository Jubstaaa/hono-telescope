import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import type { ResolvedConfig, TelescopeConfig } from '../types/index.js';
import { resolveConfig } from './config.js';
import { Recorder } from './recorder.js';
import { consoleCollector } from './collectors/console-collector.js';
import { exceptionCollector } from './collectors/exception-collector.js';
import { fetchCollector } from './collectors/fetch-collector.js';
import { createMiddleware } from './hono/middleware.js';
import { createDashboard } from './hono/dashboard.js';
import { instrumentPrisma } from './instrumentation/prisma.js';
import { instrumentSequelize } from './instrumentation/sequelize.js';
import { instrumentMongo } from './instrumentation/mongo.js';
import { instrumentBunSqlite } from './instrumentation/bun-sqlite.js';

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
      return resolved.enabled ? createDashboard(recorder, resolved) : new Hono();
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
