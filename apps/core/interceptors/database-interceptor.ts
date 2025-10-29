import { Telescope } from '../telescope';
import { EntryType } from '@hono-telescope/types';
import { formatDuration, getMemoryUsage } from '../utils';
import { ContextManager } from '../context-manager';

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
      const prismaModule = require('@prisma/client');
      if (prismaModule && prismaModule.PrismaClient) {
        this.wrapPrismaClient(prismaModule.PrismaClient);
      }
    } catch {
      // Prisma not installed, skip
    }
  }

  private wrapPrismaClient(PrismaClient: any): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;
    
    const originalQuery = PrismaClient.prototype.$queryRaw;
    const originalExecuteRaw = PrismaClient.prototype.$executeRaw;

    if (originalQuery) {
      PrismaClient.prototype.$queryRaw = async function(query: any, ...args: any[]) {
        const startTime = Date.now();
        try {
          return await originalQuery.call(this, query, ...args);
        } finally {
          const duration = Date.now() - startTime;
          const parentId = contextManager.getCurrentRequestId();
          telescope.recordQuery({
            query: query.toString(),
            bindings: args,
            time: duration,
            connection: 'prisma',
            parent_id: parentId || undefined
          });
        }
      };
    }

    if (originalExecuteRaw) {
      PrismaClient.prototype.$executeRaw = async function(query: any, ...args: any[]) {
        const startTime = Date.now();
        try {
          return await originalExecuteRaw.call(this, query, ...args);
        } finally {
          const duration = Date.now() - startTime;
          const parentId = contextManager.getCurrentRequestId();
          telescope.recordQuery({
            query: query.toString(),
            bindings: args,
            time: duration,
            connection: 'prisma',
            parent_id: parentId || undefined
          });
        }
      };
    }
  }

  private interceptSequelize(): void {
    // Try to intercept Sequelize if it exists
    try {
      const sequelize = require('sequelize');
      if (sequelize && sequelize.Sequelize) {
        this.wrapSequelize(sequelize.Sequelize);
      }
    } catch {
      // Sequelize not installed, skip
    }
  }

  private wrapSequelize(Sequelize: any): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;
    
    const originalQuery = Sequelize.prototype.query;
    
    if (originalQuery) {
      Sequelize.prototype.query = async function(sql: string, options?: any) {
        const startTime = Date.now();
        try {
          return await originalQuery.call(this, sql, options);
        } finally {
          const duration = Date.now() - startTime;
          const parentId = contextManager.getCurrentRequestId();
          telescope.recordQuery({
            query: sql,
            bindings: options?.bind || [],
            time: duration,
            connection: 'sequelize',
            parent_id: parentId || undefined
          });
        }
      };
    }
  }

  private interceptMongoDB(): void {
    // Try to intercept MongoDB if it exists
    try {
      const mongodb = require('mongodb');
      if (mongodb && mongodb.MongoClient) {
        this.wrapMongoDB(mongodb);
      }
    } catch {
      // MongoDB not installed, skip
    }
  }

  private wrapMongoDB(mongodb: any): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;
    
    // This is a simplified MongoDB interception
    const originalFind = mongodb.Collection?.prototype?.find;

    if (originalFind) {
      mongodb.Collection.prototype.find = function(query?: any, options?: any) {
        const result = originalFind.call(this, query, options);
        const startTime = Date.now();
        const baseResult = result;
        
        // Intercept toArray to measure query execution time
        const originalToArray = result.toArray;
        result.toArray = async function() {
          try {
            return await originalToArray.call(this);
          } finally {
            const duration = Date.now() - startTime;
            const parentId = contextManager.getCurrentRequestId();
            telescope.recordQuery({
              query: `db.${baseResult.collectionName}.find(${JSON.stringify(query || {})})`,
              bindings: [],
              time: duration,
              connection: 'mongodb',
              parent_id: parentId || undefined
            });
          }
        };
        
        return result;
      };
    }
  }

  private interceptBunSQLite(): void {
    // Try to intercept Bun SQLite if it exists
    try {
      const telescope = this.telescope;
      
      // Check if we're in Bun environment by checking for global Bun object
      if (typeof (globalThis as any).Bun !== 'undefined') {
        // Use dynamic import to avoid TypeScript errors
        const importBunSQLite = new Function('return import("bun:sqlite")');
        importBunSQLite().then((bunSQLite: any) => {
          if (bunSQLite && bunSQLite.Database) {
            this.wrapBunSQLiteDatabase(bunSQLite.Database, telescope);
          }
        }).catch(() => {
          // bun:sqlite not available
        });
      }
    } catch {
      // Bun SQLite not available, skip
    }
  }

  private wrapBunSQLiteDatabase(OriginalDatabase: any, telescope: any): void {
    // Store original methods
    const originalPrepare = OriginalDatabase.prototype.prepare;
    const contextManager = this.contextManager;
    
    if (originalPrepare) {
      OriginalDatabase.prototype.prepare = function(sql: string) {
        const stmt = originalPrepare.call(this, sql);
        
        // Wrap statement methods
        const originalGet = stmt.get;
        const originalAll = stmt.all;
        const originalRun = stmt.run;
        
        if (originalGet) {
          stmt.get = function(...bindings: any[]) {
            const startTime = Date.now();
            const result = originalGet.apply(this, bindings);
            const duration = Date.now() - startTime;
            const parentId = contextManager.getCurrentRequestId();
            
            telescope.recordQuery({
              query: sql,
              bindings,
              time: duration,
              connection: 'bun:sqlite',
              parent_id: parentId || undefined
            });
            
            return result;
          };
        }
        
        if (originalAll) {
          stmt.all = function(...bindings: any[]) {
            const startTime = Date.now();
            const result = originalAll.apply(this, bindings);
            const duration = Date.now() - startTime;
            const parentId = contextManager.getCurrentRequestId();
            
            telescope.recordQuery({
              query: sql,
              bindings,
              time: duration,
              connection: 'bun:sqlite',
              parent_id: parentId || undefined
            });
            
            return result;
          };
        }
        
        if (originalRun) {
          stmt.run = function(...bindings: any[]) {
            const startTime = Date.now();
            const result = originalRun.apply(this, bindings);
            const duration = Date.now() - startTime;
            const parentId = contextManager.getCurrentRequestId();
            
            telescope.recordQuery({
              query: sql,
              bindings,
              time: duration,
              connection: 'bun:sqlite',
              parent_id: parentId || undefined
            });
            
            return result;
          };
        }
        
        return stmt;
      };
    }
  }

  private interceptGenericSQL(): void {
    // Intercept console.log for SQL-like patterns
    const telescope = this.telescope;
    const originalLog = console.log;
    
    console.log = function(...args: any[]) {
      const message = args.join(' ');
      
      // Check if this looks like a SQL query
      if (typeof message === 'string' && 
          /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(message)) {
        
        // TODO: Implement proper query recording without parent context
        // For now, skip console SQL logging as it requires proper context
      }
      
      return originalLog.apply(console, args);
    };
  }

  // Helper method to record database queries
  public async recordQuery<T>(
    queryFn: () => Promise<T>,
    sql: string,
    bindings: any[] = [],
    connectionName: string = 'default'
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = getMemoryUsage();

    let result: T;
    let error: Error | null = null;

    try {
      result = await queryFn();
    } catch (err: any) {
      error = err;
      throw err;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endMemory = getMemoryUsage();
      const memoryUsed = endMemory - startMemory;

      // Get current request context
      const requestId = this.contextManager.getCurrentRequestId();

      await this.telescope.recordQuery({
        query: sql.length > 1000 ? sql.substring(0, 1000) + '...' : sql,
        bindings: bindings.length > 10 ? bindings.slice(0, 10) : bindings,
        time: duration,
        connection: connectionName,
        parent_id: requestId
      });
    }

    return result!;
  }
}