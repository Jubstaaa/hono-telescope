import { Telescope } from '../telescope';
import { ContextManager } from '../context-manager';

interface PrismaClientModule {
  PrismaClient?: {
    prototype?: {
      $queryRaw?: unknown;
      $executeRaw?: unknown;
    };
  };
}

interface SequelizeModule {
  Sequelize?: {
    prototype?: {
      query?: unknown;
    };
  };
}

interface MongoDBModule {
  MongoClient?: unknown;
  Collection?: {
    prototype?: {
      find?: unknown;
      insertOne?: unknown;
      updateOne?: unknown;
      deleteOne?: unknown;
    };
  };
}

interface BunSQLiteModule {
  Database?: {
    prototype?: {
      prepare?: unknown;
    };
  };
}

export class DatabaseInterceptor {
  private static instance: DatabaseInterceptor;
  private telescope: Telescope;
  private contextManager: ContextManager;
  private isIntercepting = false;
  private originalConsole: typeof console;

  private constructor() {
    this.telescope = Telescope.getInstance();
    this.contextManager = ContextManager.getInstance();
    this.originalConsole = { ...console };
  }

  public static getInstance(): DatabaseInterceptor {
    if (!DatabaseInterceptor.instance) {
      DatabaseInterceptor.instance = new DatabaseInterceptor();
    }
    return DatabaseInterceptor.instance;
  }

  public startIntercepting(): void {
    if (this.isIntercepting) return;

    this.isIntercepting = true;

    // Intercept common database libraries
    this.interceptPrisma();
    this.interceptSequelize();
    this.interceptMongoDB();
    this.interceptBunSQLite();
    this.interceptGenericSQL();
  }

  public stopIntercepting(): void {
    if (!this.isIntercepting) return;

    this.isIntercepting = false;
    // Restore original methods would go here
    // This is a simplified implementation
  }

  private interceptPrisma(): void {
    // Try to intercept Prisma if it exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const prismaModule = require('@prisma/client') as PrismaClientModule;
      if (prismaModule?.PrismaClient) {
        this.wrapPrismaClient(prismaModule.PrismaClient);
      }
    } catch {
      // Prisma not installed, skip
    }
  }

  private wrapPrismaClient(PrismaClient: Record<string, unknown>): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;

    const originalQuery = (PrismaClient.prototype as Record<string, unknown>)?.$queryRaw;
    const originalExecuteRaw = (PrismaClient.prototype as Record<string, unknown>)?.$executeRaw;

    if (originalQuery) {
      (PrismaClient.prototype as Record<string, unknown>).$queryRaw = async function (
        query: unknown,
        ...args: unknown[]
      ) {
        const startTime = Date.now();
        try {
          const result = await (
            originalQuery as (this: unknown, query: unknown, ...args: unknown[]) => Promise<unknown>
          ).call(this, query, ...args);
          await telescope.recordQuery({
            connection: 'prisma',
            bindings: args.map(String),
            query: String(query),
            time: Date.now() - startTime,
            parent_id: contextManager.getCurrentRequestId() || undefined,
          });
          return result;
        } catch (error) {
          await telescope.recordQuery({
            connection: 'prisma',
            bindings: args.map(String),
            query: String(query),
            time: Date.now() - startTime,
            parent_id: contextManager.getCurrentRequestId() || undefined,
          });
          throw error;
        }
      };
    }

    if (originalExecuteRaw) {
      (PrismaClient.prototype as Record<string, unknown>).$executeRaw = async function (
        query: unknown,
        ...args: unknown[]
      ) {
        const startTime = Date.now();
        try {
          const result = await (
            originalExecuteRaw as (
              this: unknown,
              query: unknown,
              ...args: unknown[]
            ) => Promise<unknown>
          ).call(this, query, ...args);
          await telescope.recordQuery({
            connection: 'prisma',
            bindings: args.map(String),
            query: String(query),
            time: Date.now() - startTime,
            parent_id: contextManager.getCurrentRequestId() || undefined,
          });
          return result;
        } catch (error) {
          await telescope.recordQuery({
            connection: 'prisma',
            bindings: args.map(String),
            query: String(query),
            time: Date.now() - startTime,
            parent_id: contextManager.getCurrentRequestId() || undefined,
          });
          throw error;
        }
      };
    }
  }

  private interceptSequelize(): void {
    // Try to intercept Sequelize if it exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sequelize = require('sequelize') as SequelizeModule;
      if (sequelize?.Sequelize) {
        this.wrapSequelize(sequelize.Sequelize);
      }
    } catch {
      // Sequelize not installed, skip
    }
  }

  private wrapSequelize(Sequelize: Record<string, unknown>): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;

    const originalQuery = (Sequelize.prototype as Record<string, unknown>)?.query;

    if (originalQuery) {
      (Sequelize.prototype as Record<string, unknown>).query = async function (
        sql: string,
        options?: Record<string, unknown>
      ) {
        const startTime = Date.now();
        try {
          const result = await (
            originalQuery as (
              this: unknown,
              sql: string,
              options?: Record<string, unknown>
            ) => Promise<unknown>
          ).call(this, sql, options);
          await telescope.recordQuery({
            connection: 'sequelize',
            bindings: ((options?.bind as unknown[]) || []).map(String),
            query: sql,
            time: Date.now() - startTime,
            parent_id: contextManager.getCurrentRequestId() || undefined,
          });
          return result;
        } catch (error) {
          await telescope.recordQuery({
            connection: 'sequelize',
            bindings: ((options?.bind as unknown[]) || []).map(String),
            query: sql,
            time: Date.now() - startTime,
            parent_id: contextManager.getCurrentRequestId() || undefined,
          });
          throw error;
        }
      };
    }
  }

  private interceptMongoDB(): void {
    // Try to intercept MongoDB if it exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mongodb = require('mongodb') as MongoDBModule;
      if (mongodb?.MongoClient) {
        this.wrapMongoDB(mongodb);
      }
    } catch {
      // MongoDB not installed, skip
    }
  }

  private wrapMongoDB(mongodb: MongoDBModule): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;

    // This is a simplified MongoDB interception
    const originalFind = (mongodb.Collection?.prototype as Record<string, unknown>)?.find;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const originalInsertOne = (mongodb.Collection?.prototype as Record<string, unknown>)?.insertOne;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const originalUpdateOne = (mongodb.Collection?.prototype as Record<string, unknown>)?.updateOne;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const originalDeleteOne = (mongodb.Collection?.prototype as Record<string, unknown>)?.deleteOne;

    if (originalFind) {
      (mongodb.Collection?.prototype as Record<string, unknown>).find = function (query?: Record<string, unknown>, options?: Record<string, unknown>) {
        const startTime = Date.now();
        const result = (originalFind as (this: unknown, query?: Record<string, unknown>, options?: Record<string, unknown>) => unknown).call(this, query, options);
        void telescope.recordQuery({
          connection: 'mongodb',
          bindings: [],
          query: `db.${(this as Record<string, unknown>).collectionName}.find(${JSON.stringify(query || {})})`,
          time: Date.now() - startTime,
          parent_id: contextManager.getCurrentRequestId() || undefined,
        });
        return result;
      };
    }
  }

  private interceptBunSQLite(): void {
    // Try to intercept Bun SQLite if it exists
    try {
      const telescope = this.telescope;
      // Check if we're in Bun environment by checking for global Bun object
      if (typeof (globalThis as Record<string, unknown>).Bun !== 'undefined') {
        // Use dynamic import to avoid TypeScript errors
        const importBunSQLite = new Function('return import("bun:sqlite")');
        (importBunSQLite() as Promise<BunSQLiteModule>)
          .then((bunSQLite: BunSQLiteModule) => {
            if (bunSQLite?.Database) {
              this.wrapBunSQLiteDatabase(bunSQLite.Database, telescope);
            }
          })
          .catch(() => {
            // bun:sqlite not available
          });
      }
    } catch {
      // Bun SQLite not available, skip
    }
  }

  private wrapBunSQLiteDatabase(
    OriginalDatabase: Record<string, unknown>,
    telescope: Telescope
  ): void {
    // Store original methods
    const originalPrepare = (OriginalDatabase.prototype as Record<string, unknown>)?.prepare;

    if (originalPrepare) {
      (OriginalDatabase.prototype as Record<string, unknown>).prepare = function (sql: string) {
        const stmt = (
          originalPrepare as (this: unknown, sql: string) => Record<string, unknown>
        ).call(this, sql);

        // Wrap statement methods
        const originalGet = stmt.get;
        const originalAll = stmt.all;
        const originalRun = stmt.run;

        if (originalGet) {
          stmt.get = function (...bindings: unknown[]) {
            const startTime = Date.now();
            const result = (
              originalGet as (this: unknown, ...bindings: unknown[]) => unknown
            ).apply(this, bindings);
            const duration = Date.now() - startTime;

            telescope.recordQuery({
              connection: 'bun:sqlite',
              bindings: bindings.map(String),
              query: sql,
              time: duration,
              parent_id: undefined,
            });

            return result;
          };
        }

        if (originalAll) {
          stmt.all = function (...bindings: unknown[]) {
            const startTime = Date.now();
            const result = (
              originalAll as (this: unknown, ...bindings: unknown[]) => unknown
            ).apply(this, bindings);
            const duration = Date.now() - startTime;

            telescope.recordQuery({
              connection: 'bun:sqlite',
              bindings: bindings.map(String),
              query: sql,
              time: duration,
              parent_id: undefined,
            });

            return result;
          };
        }

        if (originalRun) {
          stmt.run = function (...bindings: unknown[]) {
            const startTime = Date.now();
            const result = (
              originalRun as (this: unknown, ...bindings: unknown[]) => unknown
            ).apply(this, bindings);
            const duration = Date.now() - startTime;

            telescope.recordQuery({
              connection: 'bun:sqlite',
              bindings: bindings.map(String),
              query: sql,
              time: duration,
              parent_id: undefined,
            });

            return result;
          };
        }

        return stmt;
      };
    }
  }

  private interceptGenericSQL(): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;
    const originalLog = console.log;

    console.log = function (...args: unknown[]) {
      const message = args.join(' ');

      if (
        typeof message === 'string' &&
        /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(message)
      ) {
        telescope.recordQuery({
          connection: 'console',
          bindings: [],
          query: message,
          time: 0,
          parent_id: contextManager.getCurrentRequestId() || undefined,
        });
      }

      return originalLog.apply(console, args);
    };
  }

  // Helper method to record database queries
  public async recordQuery<T>(
    queryFn: () => Promise<T>,
    sql: string,
    bindings: string[] = [],
    connectionName: string = 'default'
  ): Promise<T> {
    let result: T;
    let startTime: number;
    const parentId = this.contextManager.getCurrentRequestId();

    try {
      startTime = Date.now();
      result = await queryFn();
    } finally {
      await this.telescope.recordQuery({
        connection: connectionName,
        bindings,
        query: sql,
        time: Date.now() - startTime,
        parent_id: parentId || undefined,
      });
    }

    return result;
  }
}
