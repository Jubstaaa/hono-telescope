import { describe, it, expect } from 'vitest';
import { getExceptionClassCode, sanitizeHeaders } from './helpers';
import { ExceptionClass } from '@/types';

describe('getExceptionClassCode', () => {
  it('should map TypeError', () => {
    expect(getExceptionClassCode('TypeError')).toBe(ExceptionClass.TYPE_ERROR);
  });

  it('should map SyntaxError', () => {
    expect(getExceptionClassCode('SyntaxError')).toBe(ExceptionClass.SYNTAX_ERROR);
  });

  it('should map ReferenceError', () => {
    expect(getExceptionClassCode('ReferenceError')).toBe(ExceptionClass.REFERENCE_ERROR);
  });

  it('should map RangeError', () => {
    expect(getExceptionClassCode('RangeError')).toBe(ExceptionClass.RANGE_ERROR);
  });

  it('should map ValidationError', () => {
    expect(getExceptionClassCode('ValidationError')).toBe(ExceptionClass.VALIDATION_ERROR);
  });

  it('should default to ERROR for unknown types', () => {
    expect(getExceptionClassCode('CustomError')).toBe(ExceptionClass.ERROR);
    expect(getExceptionClassCode('Error')).toBe(ExceptionClass.ERROR);
  });
});

describe('sanitizeHeaders', () => {
  it('should return headers unchanged when no redact list', () => {
    const headers = { 'content-type': 'application/json', authorization: 'Bearer token' };
    const result = sanitizeHeaders(headers);
    expect(result).toEqual(headers);
  });

  it('should return headers unchanged with empty redact list', () => {
    const headers = { 'content-type': 'application/json' };
    const result = sanitizeHeaders(headers, []);
    expect(result).toEqual(headers);
  });

  it('should redact specified headers', () => {
    const headers = {
      'content-type': 'application/json',
      authorization: 'Bearer secret',
      'x-api-key': 'my-key',
    };

    const result = sanitizeHeaders(headers, ['authorization', 'x-api-key']);

    expect(result['content-type']).toBe('application/json');
    expect(result.authorization).toBe('[SENSITIVE]');
    expect(result['x-api-key']).toBe('[SENSITIVE]');
  });

  it('should be case-insensitive when redacting', () => {
    const headers = { Authorization: 'Bearer token' };
    const result = sanitizeHeaders(headers, ['authorization']);
    expect(result.Authorization).toBe('[SENSITIVE]');
  });

  it('should NOT mutate the original headers object', () => {
    const headers = { authorization: 'Bearer token', other: 'value' };
    const original = { ...headers };

    sanitizeHeaders(headers, ['authorization']);

    expect(headers).toEqual(original);
  });
});
