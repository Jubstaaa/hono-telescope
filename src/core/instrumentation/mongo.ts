import type { Recorder } from '../recorder';

interface MongoCommandEvent {
  commandName: string;
  databaseName?: string;
  duration?: number;
}

interface MongoMonitorable {
  on(event: string, handler: (payload: MongoCommandEvent) => void): unknown;
}

export function instrumentMongo<T>(client: T, recorder: Recorder): T {
  const monitorable = client as MongoMonitorable;

  const record = (event: MongoCommandEvent) => {
    void recorder
      .recordQuery({
        connection: 'mongodb',
        query: event.databaseName
          ? `${event.databaseName}.${event.commandName}`
          : event.commandName,
        bindings: [],
        time: event.duration ?? 0,
      })
      .catch(() => undefined);
  };

  monitorable.on('commandSucceeded', record);
  monitorable.on('commandFailed', record);

  return client;
}
