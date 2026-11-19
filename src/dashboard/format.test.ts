import { FastColor } from '@ant-design/fast-color';
import { describe, expect, it } from 'vitest';

import {
  getDurationColor,
  getExceptionClassName,
  getLevelColor,
  getLevelName,
  getMethodColor,
  getStatusColor,
  TAG_COLORS,
} from './format';

// WCAG 2 contrast ratio, from the relative luminance antd's own colour library computes.
const contrast = (a: string, b: string) => {
  const [light, dark] = [new FastColor(a).getLuminance(), new FastColor(b).getLuminance()].sort(
    (x, y) => y - x
  );

  return (light + 0.05) / (dark + 0.05);
};

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
      TAG_COLORS.success,
      TAG_COLORS.warning,
      TAG_COLORS.error,
      TAG_COLORS.error,
      'default',
    ]);
  });

  it('only uses tag colours that keep white text at WCAG AA contrast', () => {
    const used = [
      ...[200, 302, 500].map(getStatusColor),
      ...['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(getMethodColor),
      ...[1, 2, 3, 4].map(getLevelColor),
      ...[10, 500, 5000].map((ms) => getDurationColor(ms)),
    ];

    for (const color of used) {
      expect(contrast(color, '#ffffff'), color).toBeGreaterThanOrEqual(4.5);
    }
  });
});
