import type { Recorder } from '../recorder.js';

interface PrismaOperationArgs {
  model?: string;
  operation: string;
  args: unknown;
  query: (args: unknown) => Promise<unknown>;
}

interface PrismaExtendable {
  $extends(extension: {
    name: string;
    query: { $allOperations: (args: PrismaOperationArgs) => Promise<unknown> };
  }): unknown;
}

export function instrumentPrisma<T>(client: T, recorder: Recorder): T {
  const extendable = client as PrismaExtendable;

  return extendable.$extends({
    name: 'hono-telescope',
    query: {
      async $allOperations({ model, operation, args, query }: PrismaOperationArgs) {
        const startTime = Date.now();

        try {
          return await query(args);
        } finally {
          let bindings: string[];
          try {
            bindings = [JSON.stringify(args ?? {})];
          } catch {
            bindings = ['<unserializable>'];
          }

          void recorder
            .recordQuery({
              connection: 'prisma',
              query: model ? `${model}.${operation}` : operation,
              bindings,
              time: Date.now() - startTime,
            })
            .catch(() => undefined);
        }
      },
    },
  }) as T;
}
