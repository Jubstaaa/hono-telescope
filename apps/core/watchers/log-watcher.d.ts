export declare class LogWatcher {
    private telescope;
    private contextManager;
    private originalConsole;
    constructor();
    start(): void;
    stop(): void;
    private interceptConsoleLog;
    private interceptConsoleWarn;
    private interceptConsoleError;
    private interceptConsoleInfo;
    private interceptConsoleDebug;
    private recordLog;
    private getStackTrace;
}
export declare function startLogWatcher(): void;
export declare function stopLogWatcher(): void;
