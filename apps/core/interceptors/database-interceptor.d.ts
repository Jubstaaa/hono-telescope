export declare class DatabaseInterceptor {
    private static instance;
    private telescope;
    private contextManager;
    private isIntercepting;
    private originalConsole;
    private constructor();
    static getInstance(): DatabaseInterceptor;
    startIntercepting(): void;
    stopIntercepting(): void;
    private interceptPrisma;
    private wrapPrismaClient;
    private interceptSequelize;
    private wrapSequelize;
    private interceptMongoDB;
    private wrapMongoDB;
    private interceptBunSQLite;
    private wrapBunSQLiteDatabase;
}
