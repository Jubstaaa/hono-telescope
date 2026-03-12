import { describe, it, expect } from 'vitest';
import { ContextManager } from './context-manager';

describe('ContextManager', () => {
  it('should be a singleton', () => {
    const a = ContextManager.getInstance();
    const b = ContextManager.getInstance();
    expect(a).toBe(b);
  });

  it('should return undefined when no context is active', () => {
    const manager = ContextManager.getInstance();
    expect(manager.getCurrentContext()).toBeUndefined();
    expect(manager.getCurrentRequestId()).toBeUndefined();
  });

  it('should provide context within run callback', () => {
    const manager = ContextManager.getInstance();

    const context = {
      requestId: 'test-req-1',
      method: 'GET',
      uri: '/test',
      startTime: Date.now(),
    };

    manager.run(context, () => {
      expect(manager.getCurrentContext()).toEqual(context);
      expect(manager.getCurrentRequestId()).toBe('test-req-1');
    });
  });

  it('should isolate contexts between nested runs', () => {
    const manager = ContextManager.getInstance();

    const outerContext = {
      requestId: 'outer',
      method: 'GET',
      uri: '/outer',
      startTime: Date.now(),
    };

    const innerContext = {
      requestId: 'inner',
      method: 'POST',
      uri: '/inner',
      startTime: Date.now(),
    };

    manager.run(outerContext, () => {
      expect(manager.getCurrentRequestId()).toBe('outer');

      manager.run(innerContext, () => {
        expect(manager.getCurrentRequestId()).toBe('inner');
      });

      expect(manager.getCurrentRequestId()).toBe('outer');
    });
  });

  it('should return the callback result', () => {
    const manager = ContextManager.getInstance();

    const result = manager.run(
      { requestId: 'x', method: 'GET', uri: '/', startTime: 0 },
      () => 42
    );

    expect(result).toBe(42);
  });
});
