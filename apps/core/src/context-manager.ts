import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  method: string;
  uri: string;
  startTime: number;
}

export class ContextManager {
  private static instance: ContextManager;
  private asyncLocalStorage: AsyncLocalStorage<RequestContext>;

  private constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  public run<T>(context: RequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  public getCurrentContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  public getCurrentRequestId(): string | undefined {
    const context = this.getCurrentContext();
    return context?.requestId;
  }
}
