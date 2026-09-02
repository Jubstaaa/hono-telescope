import { describe, expect, it } from 'vitest';

import { alsContext } from './context/als-context.js';
import { Recorder } from './recorder.js';
import { memoryStorage } from './storage/memory-storage.js';

const build = () => {
  const storage = memoryStorage();
  const context = alsContext();
  return { context, recorder: new Recorder(storage, context), storage };
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
    const { context, recorder, storage } = build();

    await context.run({ method: 'GET', requestId: 'req-1', startTime: 0, uri: '/x' }, () =>
      recorder.record('log', { level: 1, message: 'hi' })
    );

    expect((await storage.list('log'))[0].parent_id).toBe('req-1');
  });

  it('never makes an incoming_request its own parent', async () => {
    const { context, recorder, storage } = build();

    await context.run({ method: 'GET', requestId: 'req-1', startTime: 0, uri: '/x' }, () =>
      recorder.record(
        'incoming_request',
        {
          duration: 1,
          headers: {},
          method: 'GET',
          payload: {},
          response: {},
          response_headers: {},
          response_status: 200,
          uri: '/x',
        },
        'req-1'
      )
    );

    expect((await storage.list('incoming_request'))[0].parent_id).toBeUndefined();
  });

  it('prefers an explicit parent_id over the ambient one', async () => {
    const { context, recorder, storage } = build();

    await context.run({ method: 'GET', requestId: 'req-1', startTime: 0, uri: '/x' }, () =>
      recorder.record('log', { level: 1, message: 'hi', parent_id: 'explicit' })
    );

    expect((await storage.list('log'))[0].parent_id).toBe('explicit');
  });
});
