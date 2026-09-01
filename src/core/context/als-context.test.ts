import { describe, expect, it } from 'vitest';
import { alsContext } from './als-context.js';
import type { RequestContext } from './context-strategy.js';

const ctx = (requestId: string): RequestContext => ({
  requestId,
  method: 'GET',
  uri: '/x',
  startTime: 0,
});

describe('alsContext', () => {
  it('returns undefined outside a run', () => {
    expect(alsContext().current()).toBeUndefined();
  });

  it('exposes the context inside a run', () => {
    const context = alsContext();

    context.run(ctx('a'), () => {
      expect(context.current()?.requestId).toBe('a');
    });
  });

  it('survives an await boundary', async () => {
    const context = alsContext();

    await context.run(ctx('a'), async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      expect(context.current()?.requestId).toBe('a');
    });
  });

  it('keeps concurrent runs isolated', async () => {
    const context = alsContext();
    const seen: string[] = [];

    const task = (id: string, delay: number) =>
      context.run(ctx(id), async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        seen.push(context.current()!.requestId);
      });

    await Promise.all([task('slow', 5), task('fast', 1)]);

    expect(seen).toEqual(['fast', 'slow']);
  });
});
