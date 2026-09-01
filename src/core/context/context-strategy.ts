export interface RequestContext {
  requestId: string;
  method: string;
  uri: string;
  startTime: number;
}

export interface ContextStrategy {
  run<T>(ctx: RequestContext, fn: () => T): T;
  current(): RequestContext | undefined;
}
