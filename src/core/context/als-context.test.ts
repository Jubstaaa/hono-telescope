import { describe, expect, it } from 'vitest';

import { alsContext } from './als-context.js';
import type { RequestContext } from './context-strategy.js';

const ctx = (requestId: string): RequestContext => ({
  method: 'GET',
  requestId,
  startTime: 0,
  uri: '/x',
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
    let releaseSlow = () => undefined as void;
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });

    const slow = context.run(ctx('slow'), async () => {
      await slowGate;
      seen.push(context.current()!.requestId);
    });
    const fast = context.run(ctx('fast'), async () => {
      seen.push(context.current()!.requestId);
    });

    await fast;
    releaseSlow();
    await slow;

    expect(seen).toEqual(['fast', 'slow']);
  });
});
