import { ExceptionClass } from './entries.js'

export const getExceptionClassCode = (errorName: string): ExceptionClass => {
    switch (errorName) {
        case 'RangeError':
            return ExceptionClass.RANGE_ERROR
        case 'ReferenceError':
            return ExceptionClass.REFERENCE_ERROR
        case 'SyntaxError':
            return ExceptionClass.SYNTAX_ERROR
        case 'TypeError':
            return ExceptionClass.TYPE_ERROR
        case 'ValidationError':
            return ExceptionClass.VALIDATION_ERROR
        default:
            return ExceptionClass.ERROR
    }
}
