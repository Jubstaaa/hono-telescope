import { describe, expect, it } from 'vitest';

import { getExceptionClassName, getLevelName, getStatusColor } from './format';

describe('dashboard format helpers', () => {
  it('names every log level and falls back for an unknown one', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(getLevelName)).toEqual([
      'DEBUG',
      'INFO',
      'NOTICE',
      'WARNING',
      'ERROR',
      'CRITICAL',
      'ALERT',
      'EMERGENCY',
    ]);
    expect(getLevelName(99)).toBe('UNKNOWN');
  });

  it('names exception classes and falls back for an unknown one', () => {
    expect(getExceptionClassName(3)).toBe('TypeError');
    expect(getExceptionClassName(99)).toBe('Unknown');
  });

  it('colours statuses by class', () => {
    expect([204, 302, 404, 500, undefined].map(getStatusColor)).toEqual([
      'success',
      'warning',
      'error',
      'error',
      'default',
    ]);
  });
});
