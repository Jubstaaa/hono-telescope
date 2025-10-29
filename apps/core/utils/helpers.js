import { ExceptionClass } from "@hono-telescope/types";
export const getExceptionClassCode = (errorName) => {
    switch (errorName) {
        case 'TypeError': return ExceptionClass.TYPE_ERROR;
        case 'SyntaxError': return ExceptionClass.SYNTAX_ERROR;
        case 'ReferenceError': return ExceptionClass.REFERENCE_ERROR;
        case 'RangeError': return ExceptionClass.RANGE_ERROR;
        case 'ValidationError': return ExceptionClass.VALIDATION_ERROR;
        default: return ExceptionClass.ERROR;
    }
};
