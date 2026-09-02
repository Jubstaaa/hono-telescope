import type { Recorder } from '../recorder.js';
import { failureFields } from './failure.js';

interface MongoCommandEvent {
  commandName: string;
  databaseName?: string;
  duration?: number;
  failure?: unknown;
}

interface MongoMonitorable {
  on(event: string, handler: (payload: MongoCommandEvent) => void): unknown;
}

export function instrumentMongo<T>(client: T, recorder: Recorder): T {
  const monitorable = client as MongoMonitorable;

  const record = (event: MongoCommandEvent, failure?: unknown) => {
    void recorder
      .recordQuery({
        connection: 'mongodb',
        query: event.databaseName
          ? `${event.databaseName}.${event.commandName}`
          : event.commandName,
        bindings: [],
        time: event.duration ?? 0,
        ...failureFields(failure),
      })
      .catch(() => undefined);
  };

  monitorable.on('commandSucceeded', (event) => record(event));
  monitorable.on('commandFailed', (event) => record(event, event.failure ?? new Error('failed')));

  return client;
}
