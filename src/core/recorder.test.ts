import { describe, expect, it } from 'vitest';
import { Recorder } from './recorder.js';
import { memoryStorage } from './storage/memory-storage.js';
import { alsContext } from './context/als-context.js';

const build = () => {
  const storage = memoryStorage();
  const context = alsContext();
  return { storage, context, recorder: new Recorder(storage, context) };
};

describe('Recorder', () => {
  it('stamps id, timestamp and created_at', async () => {
    const { recorder, storage } = build();

    const id = await recorder.record('log', { level: 1, message: 'hi' });
    const entry = await storage.find('log', id);

    expect(entry).toMatchObject({ id, message: 'hi' });
    expect(typeof entry!.timestamp).toBe('number');
    expect(Date.parse(entry!.created_at)).not.toBeNaN();
  });

  it('honours an explicit id', async () => {
    const { recorder } = build();

    expect(await recorder.record('log', { level: 1, message: 'hi' }, 'fixed')).toBe('fixed');
  });

  it('inherits parent_id from the ambient context', async () => {
    const { recorder, context, storage } = build();

    await context.run({ requestId: 'req-1', method: 'GET', uri: '/x', startTime: 0 }, () =>
      recorder.record('log', { level: 1, message: 'hi' })
    );

    expect((await storage.list('log'))[0].parent_id).toBe('req-1');
  });

  it('never makes an incoming_request its own parent', async () => {
    const { recorder, context, storage } = build();

    await context.run({ requestId: 'req-1', method: 'GET', uri: '/x', startTime: 0 }, () =>
      recorder.record(
        'incoming_request',
        {
          method: 'GET',
          uri: '/x',
          headers: {},
          payload: {},
          response_status: 200,
          response_headers: {},
          response: {},
          duration: 1,
        },
        'req-1'
      )
    );

    expect((await storage.list('incoming_request'))[0].parent_id).toBeUndefined();
  });

  it('prefers an explicit parent_id over the ambient one', async () => {
    const { recorder, context, storage } = build();

    await context.run({ requestId: 'req-1', method: 'GET', uri: '/x', startTime: 0 }, () =>
      recorder.record('log', { level: 1, message: 'hi', parent_id: 'explicit' })
    );

    expect((await storage.list('log'))[0].parent_id).toBe('explicit');
  });
});
