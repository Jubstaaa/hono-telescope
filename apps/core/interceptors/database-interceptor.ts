import { Telescope } from '../telescope';
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
    
    this.interceptPrisma();
    this.interceptSequelize();
    this.interceptMongoDB();
    this.interceptBunSQLite();
  }

  public stopIntercepting(): void {
    if (!this.isIntercepting) return;

    this.isIntercepting = false;
  }

  private interceptPrisma(): void {
    try {
      const prismaModule = require('@prisma/client');
      if (prismaModule && prismaModule.PrismaClient) {
        this.wrapPrismaClient(prismaModule.PrismaClient);
      }
    } catch {
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
    try {
      const sequelize = require('sequelize');
      if (sequelize && sequelize.Sequelize) {
        this.wrapSequelize(sequelize.Sequelize);
      }
    } catch {
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
    try {
      const mongodb = require('mongodb');
      if (mongodb && mongodb.MongoClient) {
        this.wrapMongoDB(mongodb);
      }
    } catch {
    }
  }

  private wrapMongoDB(mongodb: any): void {
    const telescope = this.telescope;
    const contextManager = this.contextManager;
    
    const originalFind = mongodb.Collection?.prototype?.find;

    if (originalFind) {
      mongodb.Collection.prototype.find = function(query?: any, options?: any) {
        const result = originalFind.call(this, query, options);
        const startTime = Date.now();
        const baseResult = result;
        
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
    try {
      const telescope = this.telescope;
      
      if (typeof (globalThis as any).Bun !== 'undefined') {
        const importBunSQLite = new Function('return import("bun:sqlite")');
        importBunSQLite().then((bunSQLite: any) => {
          if (bunSQLite && bunSQLite.Database) {
            this.wrapBunSQLiteDatabase(bunSQLite.Database, telescope);
          }
        }).catch(() => {
        });
      }
    } catch {
    }
  }

  private wrapBunSQLiteDatabase(OriginalDatabase: any, telescope: any): void {
    const originalPrepare = OriginalDatabase.prototype.prepare;
    const contextManager = this.contextManager;
    
    if (originalPrepare) {
      OriginalDatabase.prototype.prepare = function(sql: string) {
        const stmt = originalPrepare.call(this, sql);
        
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
}