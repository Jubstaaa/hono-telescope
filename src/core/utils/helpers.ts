import { ExceptionClass } from '@hono-telescope/types';

export const getExceptionClassCode = (errorName: string): number => {
  switch (errorName) {
    case 'TypeError':
      return ExceptionClass.TYPE_ERROR;
    case 'SyntaxError':
      return ExceptionClass.SYNTAX_ERROR;
    case 'ReferenceError':
      return ExceptionClass.REFERENCE_ERROR;
    case 'RangeError':
      return ExceptionClass.RANGE_ERROR;
    case 'ValidationError':
      return ExceptionClass.VALIDATION_ERROR;
    default:
      return ExceptionClass.ERROR;
  }
};

export function sanitizeHeaders(
  headers: Record<string, unknown>,
  headersToRedact?: string[]
): Record<string, unknown> {
  if (!headersToRedact || headersToRedact.length === 0) {
    return headers;
  }

  const lowerRedactList = headersToRedact.map((h) => h.toLowerCase());

  for (const key in headers) {
    if (lowerRedactList.includes(key.toLowerCase())) {
      headers[key] = '[SENSITIVE]';
    }
  }

  return headers;
}
