import type { Recorder } from '../recorder.js';

import { failureFields } from './failure.js';

interface PrismaOperationArgs {
  args: unknown;
  model?: string;
  operation: string;
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
      async $allOperations({ args, model, operation, query }: PrismaOperationArgs) {
        const startTime = Date.now();

        let failure: unknown;

        try {
          return await query(args);
        } catch (error) {
          failure = error ?? new Error('failed');
          throw error;
        } finally {
          let bindings: string[];
          try {
            bindings = [JSON.stringify(args ?? {})];
          } catch {
            bindings = ['<unserializable>'];
          }

          void recorder
            .recordQuery({
              bindings,
              connection: 'prisma',
              query: model ? `${model}.${operation}` : operation,
              time: Date.now() - startTime,
              ...failureFields(failure),
            })
            .catch(() => undefined);
        }
      },
    },
  }) as T;
}
