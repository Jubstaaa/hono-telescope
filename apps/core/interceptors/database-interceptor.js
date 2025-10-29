import { Telescope } from '../telescope';
import { ContextManager } from '../context-manager';
export class DatabaseInterceptor {
    static instance;
    telescope;
    contextManager;
    isIntercepting = false;
    originalConsole;
    constructor() {
        this.telescope = Telescope.getInstance();
        this.contextManager = ContextManager.getInstance();
        this.originalConsole = { ...console };
    }
    static getInstance() {
        if (!DatabaseInterceptor.instance) {
            DatabaseInterceptor.instance = new DatabaseInterceptor();
        }
        return DatabaseInterceptor.instance;
    }
    startIntercepting() {
        if (this.isIntercepting)
            return;
        this.isIntercepting = true;
        this.interceptPrisma();
        this.interceptSequelize();
        this.interceptMongoDB();
        this.interceptBunSQLite();
    }
    stopIntercepting() {
        if (!this.isIntercepting)
            return;
        this.isIntercepting = false;
    }
    interceptPrisma() {
        try {
            const prismaModule = require('@prisma/client');
            if (prismaModule && prismaModule.PrismaClient) {
                this.wrapPrismaClient(prismaModule.PrismaClient);
            }
        }
        catch {
        }
    }
    wrapPrismaClient(PrismaClient) {
        const telescope = this.telescope;
        const contextManager = this.contextManager;
        const originalQuery = PrismaClient.prototype.$queryRaw;
        const originalExecuteRaw = PrismaClient.prototype.$executeRaw;
        if (originalQuery) {
            PrismaClient.prototype.$queryRaw = async function (query, ...args) {
                const startTime = Date.now();
                try {
                    return await originalQuery.call(this, query, ...args);
                }
                finally {
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
            PrismaClient.prototype.$executeRaw = async function (query, ...args) {
                const startTime = Date.now();
                try {
                    return await originalExecuteRaw.call(this, query, ...args);
                }
                finally {
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
    interceptSequelize() {
        try {
            const sequelize = require('sequelize');
            if (sequelize && sequelize.Sequelize) {
                this.wrapSequelize(sequelize.Sequelize);
            }
        }
        catch {
        }
    }
    wrapSequelize(Sequelize) {
        const telescope = this.telescope;
        const contextManager = this.contextManager;
        const originalQuery = Sequelize.prototype.query;
        if (originalQuery) {
            Sequelize.prototype.query = async function (sql, options) {
                const startTime = Date.now();
                try {
                    return await originalQuery.call(this, sql, options);
                }
                finally {
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
    interceptMongoDB() {
        try {
            const mongodb = require('mongodb');
            if (mongodb && mongodb.MongoClient) {
                this.wrapMongoDB(mongodb);
            }
        }
        catch {
        }
    }
    wrapMongoDB(mongodb) {
        const telescope = this.telescope;
        const contextManager = this.contextManager;
        const originalFind = mongodb.Collection?.prototype?.find;
        if (originalFind) {
            mongodb.Collection.prototype.find = function (query, options) {
                const result = originalFind.call(this, query, options);
                const startTime = Date.now();
                const baseResult = result;
                const originalToArray = result.toArray;
                result.toArray = async function () {
                    try {
                        return await originalToArray.call(this);
                    }
                    finally {
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
    interceptBunSQLite() {
        try {
            const telescope = this.telescope;
            if (typeof globalThis.Bun !== 'undefined') {
                const importBunSQLite = new Function('return import("bun:sqlite")');
                importBunSQLite().then((bunSQLite) => {
                    if (bunSQLite && bunSQLite.Database) {
                        this.wrapBunSQLiteDatabase(bunSQLite.Database, telescope);
                    }
                }).catch(() => {
                });
            }
        }
        catch {
        }
    }
    wrapBunSQLiteDatabase(OriginalDatabase, telescope) {
        const originalPrepare = OriginalDatabase.prototype.prepare;
        const contextManager = this.contextManager;
        if (originalPrepare) {
            OriginalDatabase.prototype.prepare = function (sql) {
                const stmt = originalPrepare.call(this, sql);
                const originalGet = stmt.get;
                const originalAll = stmt.all;
                const originalRun = stmt.run;
                if (originalGet) {
                    stmt.get = function (...bindings) {
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
                    stmt.all = function (...bindings) {
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
                    stmt.run = function (...bindings) {
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
