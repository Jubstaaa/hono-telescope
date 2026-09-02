import { AsyncLocalStorage } from 'node:async_hooks';

import type { ContextStrategy, RequestContext } from './context-strategy.js';

export function alsContext(): ContextStrategy {
  const storage = new AsyncLocalStorage<RequestContext>();

  return {
    current: () => storage.getStore(),
    run: (ctx, fn) => storage.run(ctx, fn),
  };
}
