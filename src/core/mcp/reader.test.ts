import { describe, expect, it } from 'vitest';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';
import { alsContext } from '../context/als-context.js';
import { ExceptionClass, LogLevel } from '../../types/index.js';
import { MAX_SCAN, MESSAGE_CAP, TRACE_CAP, createMcpReader } from './reader.js';

function build() {
  const recorder = new Recorder(memoryStorage({ maxEntries: 5000 }), alsContext());
  return { recorder, reader: createMcpReader(recorder) };
}

async function recordRequest(
  recorder: Recorder,
  overrides: Partial<{ uri: string; response_status: number; duration: number }> = {}
) {
  return recorder.record('incoming_request', {
    method: 'GET',
    uri: overrides.uri ?? '/api/users',
    headers: {},
    payload: {},
    response_status: overrides.response_status ?? 200,
    response_headers: {},
    response: {},
    duration: overrides.duration ?? 5,
  });
}

describe('recentRequests', () => {
  it('returns newest first and reports the scan', async () => {
    const { recorder, reader } = build();
    await recordRequest(recorder, { uri: '/first' });
    await recordRequest(recorder, { uri: '/second' });

    const result = await reader.recentRequests({ limit: 10 });

    expect(result.requests).toMatchObject([{ uri: '/second' }, { uri: '/first' }]);
    expect(result).toMatchObject({ scanned: 2, scanLimitReached: false });
  });

  it('filters on status exactly and on minStatus inclusively', async () => {
    const { recorder, reader } = build();
    await recordRequest(recorder, { uri: '/ok', response_status: 200 });
    await recordRequest(recorder, { uri: '/missing', response_status: 404 });
    await recordRequest(recorder, { uri: '/boom', response_status: 500 });

    const exact = await reader.recentRequests({ limit: 10, status: 404 });
    const range = await reader.recentRequests({ limit: 10, minStatus: 400 });

    expect(exact.requests).toMatchObject([{ uri: '/missing' }]);
    expect(range.requests).toMatchObject([{ uri: '/boom' }, { uri: '/missing' }]);
  });

  it('combines filters with AND', async () => {
    const { recorder, reader } = build();
    await recordRequest(recorder, { uri: '/api/slow', response_status: 500, duration: 900 });
    await recordRequest(recorder, { uri: '/api/slow', response_status: 200, duration: 900 });
    await recordRequest(recorder, { uri: '/other', response_status: 500, duration: 900 });

    const result = await reader.recentRequests({
      limit: 10,
      minStatus: 500,
      minDuration: 500,
      uriContains: '/api/',
    });

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]).toMatchObject({ uri: '/api/slow', response_status: 500 });
  });

  it('honours limit after filtering', async () => {
    const { recorder, reader } = build();
    await recordRequest(recorder, { response_status: 500 });
    await recordRequest(recorder, { response_status: 500 });

    expect((await reader.recentRequests({ limit: 1, minStatus: 500 })).requests).toHaveLength(1);
  });

  it('counts children per request', async () => {
    const { recorder, reader } = build();
    const parent = await recordRequest(recorder);
    await recorder.record('log', { parent_id: parent, level: LogLevel.INFO, message: 'hello' });
    await recorder.record('query', {
      parent_id: parent,
      connection: 'bun:sqlite',
      query: 'SELECT 1',
      bindings: [],
      time: 1,
    });

    const result = await reader.recentRequests({ limit: 10 });

    expect(result.requests[0]).toMatchObject({
      counts: { logs: 1, queries: 1, exceptions: 0, outgoing: 0 },
    });
  });

  it('stops at MAX_SCAN and says so', async () => {
    const { recorder, reader } = build();
    for (let i = 0; i < MAX_SCAN + 1; i += 1) await recordRequest(recorder, { uri: `/n/${i}` });

    const result = await reader.recentRequests({ limit: 10, uriContains: 'no-such-path' });

    expect(result).toMatchObject({ scanned: MAX_SCAN, scanLimitReached: true });
    expect(result.requests).toHaveLength(0);
  });

  it('does not claim the scan limit was reached when the store is exhausted', async () => {
    const { recorder, reader } = build();
    for (let i = 0; i < MAX_SCAN; i += 1) await recordRequest(recorder, { uri: `/n/${i}` });

    const result = await reader.recentRequests({ limit: 10, uriContains: 'no-such-path' });

    expect(result).toMatchObject({ scanned: MAX_SCAN, scanLimitReached: false });
  });
});

describe('recentExceptions', () => {
  it("assembles the exception with its request and that request's other children", async () => {
    const { recorder, reader } = build();
    const parent = await recordRequest(recorder, { uri: '/api/error', response_status: 500 });
    await recorder.record('log', { parent_id: parent, level: LogLevel.INFO, message: 'before' });
    await recorder.record('query', {
      parent_id: parent,
      connection: 'bun:sqlite',
      query: 'SELECT 1',
      bindings: [],
      time: 2,
    });
    await recorder.record('outgoing_request', {
      parent_id: parent,
      method: 'GET',
      uri: 'https://upstream.test/',
      headers: {},
      payload: {},
      response_status: 200,
      response_headers: {},
      response: {},
      duration: 12,
    });
    await recorder.record('exception', {
      parent_id: parent,
      class: ExceptionClass.ERROR,
      message: 'boom',
      trace: 'at handler',
    });

    const { exceptions } = await reader.recentExceptions(5);

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]).toMatchObject({
      message: 'boom',
      request: { uri: '/api/error', response_status: 500 },
      logs: [{ message: 'before' }],
      queries: [{ query: 'SELECT 1' }],
      outgoing: [{ uri: 'https://upstream.test/' }],
    });
  });

  it('omits the request and children for a parentless exception', async () => {
    const { recorder, reader } = build();
    await recorder.record('exception', {
      class: ExceptionClass.ERROR,
      message: 'unhandled',
      trace: 'at top level',
    });

    const { exceptions } = await reader.recentExceptions(5);

    expect(exceptions[0]).not.toHaveProperty('request');
    expect(exceptions[0]).not.toHaveProperty('logs');
  });

  it('truncates the trace at the cap and marks it', async () => {
    const { recorder, reader } = build();
    await recorder.record('exception', {
      class: ExceptionClass.ERROR,
      message: 'x',
      trace: 'a'.repeat(TRACE_CAP + 1),
    });

    const { exceptions } = await reader.recentExceptions(5);

    expect(exceptions[0]).toMatchObject({ truncated: true });
    expect((exceptions[0] as { trace: string }).trace).toHaveLength(TRACE_CAP);
  });

  it('leaves a trace of exactly the cap alone', async () => {
    const { recorder, reader } = build();
    await recorder.record('exception', {
      class: ExceptionClass.ERROR,
      message: 'x',
      trace: 'a'.repeat(TRACE_CAP),
    });

    const { exceptions } = await reader.recentExceptions(5);

    expect(exceptions[0]).not.toHaveProperty('truncated');
    expect((exceptions[0] as { trace: string }).trace).toHaveLength(TRACE_CAP);
  });

  it('truncates a long message at MESSAGE_CAP', async () => {
    const { recorder, reader } = build();
    await recorder.record('exception', {
      class: ExceptionClass.ERROR,
      message: 'm'.repeat(MESSAGE_CAP + 1),
      trace: 'short',
    });

    const { exceptions } = await reader.recentExceptions(5);

    expect((exceptions[0] as { message: string }).message).toHaveLength(MESSAGE_CAP);
  });
});

describe('requestDetail', () => {
  it('returns the untruncated entry with every child in full', async () => {
    const { recorder, reader } = build();
    const parent = await recorder.record('incoming_request', {
      method: 'POST',
      uri: '/orders',
      headers: { authorization: '[REDACTED]' },
      payload: { note: 'n'.repeat(MESSAGE_CAP + 50) },
      response_status: 201,
      response_headers: {},
      response: { id: 1 },
      duration: 9,
    });
    await recorder.record('log', { parent_id: parent, level: LogLevel.ERROR, message: 'oops' });

    const detail = await reader.requestDetail(parent);

    expect(detail).toMatchObject({
      request: {
        uri: '/orders',
        headers: { authorization: '[REDACTED]' },
        response: { id: 1 },
        logs: [{ message: 'oops' }],
      },
    });
    const payload = (detail as { request: { payload: { note: string } } }).request.payload;
    expect(payload.note).toHaveLength(MESSAGE_CAP + 50);
  });

  it('returns null for an unknown id', async () => {
    const { reader } = build();

    expect(await reader.requestDetail('nope')).toBeNull();
  });
});

describe('slowQueries', () => {
  it('sorts by time descending and attaches the request', async () => {
    const { recorder, reader } = build();
    const parent = await recordRequest(recorder, { uri: '/api/users/1' });
    for (const time of [3, 41, 7]) {
      await recorder.record('query', {
        parent_id: parent,
        connection: 'bun:sqlite',
        query: `SELECT ${time}`,
        bindings: [],
        time,
      });
    }

    const { queries } = await reader.slowQueries({ limit: 10, minMs: 0 });

    expect(queries.map((q) => (q as { time: number }).time)).toEqual([41, 7, 3]);
    expect(queries[0]).toMatchObject({ request: { uri: '/api/users/1' } });
  });

  it('applies minMs and limit', async () => {
    const { recorder, reader } = build();
    for (const time of [1, 50, 80]) {
      await recorder.record('query', {
        connection: 'bun:sqlite',
        query: 'SELECT 1',
        bindings: [],
        time,
      });
    }

    const { queries } = await reader.slowQueries({ limit: 1, minMs: 10 });

    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({ time: 80 });
  });
});

describe('stats', () => {
  it('counts every entry type', async () => {
    const { recorder, reader } = build();
    await recordRequest(recorder);
    await recorder.record('log', { level: LogLevel.INFO, message: 'x' });

    expect(await reader.stats()).toEqual({
      incomingRequests: { total: 1 },
      outgoingRequests: { total: 0 },
      exceptions: { total: 0 },
      queries: { total: 0 },
      logs: { total: 1 },
    });
  });
});
