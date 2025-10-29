export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["NOTICE"] = 2] = "NOTICE";
    LogLevel[LogLevel["WARNING"] = 3] = "WARNING";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["CRITICAL"] = 5] = "CRITICAL";
    LogLevel[LogLevel["ALERT"] = 6] = "ALERT";
    LogLevel[LogLevel["EMERGENCY"] = 7] = "EMERGENCY";
})(LogLevel || (LogLevel = {}));
export var ExceptionClass;
(function (ExceptionClass) {
    ExceptionClass[ExceptionClass["ERROR"] = 0] = "ERROR";
    ExceptionClass[ExceptionClass["EXCEPTION"] = 1] = "EXCEPTION";
    ExceptionClass[ExceptionClass["RUNTIME_ERROR"] = 2] = "RUNTIME_ERROR";
    ExceptionClass[ExceptionClass["TYPE_ERROR"] = 3] = "TYPE_ERROR";
    ExceptionClass[ExceptionClass["SYNTAX_ERROR"] = 4] = "SYNTAX_ERROR";
    ExceptionClass[ExceptionClass["REFERENCE_ERROR"] = 5] = "REFERENCE_ERROR";
    ExceptionClass[ExceptionClass["RANGE_ERROR"] = 6] = "RANGE_ERROR";
    ExceptionClass[ExceptionClass["VALIDATION_ERROR"] = 7] = "VALIDATION_ERROR";
    ExceptionClass[ExceptionClass["NOT_FOUND"] = 8] = "NOT_FOUND";
    ExceptionClass[ExceptionClass["UNAUTHORIZED"] = 9] = "UNAUTHORIZED";
    ExceptionClass[ExceptionClass["FORBIDDEN"] = 10] = "FORBIDDEN";
    ExceptionClass[ExceptionClass["BAD_REQUEST"] = 11] = "BAD_REQUEST";
    ExceptionClass[ExceptionClass["INTERNAL_SERVER_ERROR"] = 12] = "INTERNAL_SERVER_ERROR";
})(ExceptionClass || (ExceptionClass = {}));
