export interface RequestContext {
  method: string;
  requestId: string;
  startTime: number;
  uri: string;
}

export interface ContextStrategy {
  current(): RequestContext | undefined;
  run<T>(ctx: RequestContext, fn: () => T): T;
}
