import { AsyncLocalStorage } from 'node:async_hooks';
import type { ContextStrategy, RequestContext } from './context-strategy';

export function alsContext(): ContextStrategy {
  const storage = new AsyncLocalStorage<RequestContext>();

  return {
    run: (ctx, fn) => storage.run(ctx, fn),
    current: () => storage.getStore(),
  };
}
