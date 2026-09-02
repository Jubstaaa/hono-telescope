import { describe, expect, it } from 'vitest';

import { ExceptionClass } from '../../types/index.js';

import { getExceptionClassCode } from './helpers.js';

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
