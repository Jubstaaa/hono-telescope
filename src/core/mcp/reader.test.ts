import { describe, expect, it } from 'vitest';

import { ExceptionClass, LogLevel } from '../../types/index.js';
import { alsContext } from '../context/als-context.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { createMcpReader, MAX_SCAN, MESSAGE_CAP, TRACE_CAP } from './reader.js';

function build() {
  const recorder = new Recorder(memoryStorage({ maxEntries: 5000 }), alsContext());
  return { reader: createMcpReader(recorder), recorder };
}

async function recordRequest(
  recorder: Recorder,
  overrides: Partial<{ duration: number; response_status: number; uri: string }> = {}
) {
  return recorder.record('incoming_request', {
    duration: overrides.duration ?? 5,
    headers: {},
    method: 'GET',
    payload: {},
    response: {},
    response_headers: {},
    response_status: overrides.response_status ?? 200,
    uri: overrides.uri ?? '/api/users',
  });
}

describe('recentRequests', () => {
  it('returns newest first and reports the scan', async () => {
    const { reader, recorder } = build();
    await recordRequest(recorder, { uri: '/first' });
    await recordRequest(recorder, { uri: '/second' });

    const result = await reader.recentRequests({ limit: 10 });

    expect(result.requests).toMatchObject([{ uri: '/second' }, { uri: '/first' }]);
    expect(result).toMatchObject({ scanLimitReached: false, scanned: 2 });
  });

  it('filters on status exactly and on minStatus inclusively', async () => {
    const { reader, recorder } = build();
    await recordRequest(recorder, { response_status: 200, uri: '/ok' });
    await recordRequest(recorder, { response_status: 404, uri: '/missing' });
    await recordRequest(recorder, { response_status: 500, uri: '/boom' });

    const exact = await reader.recentRequests({ limit: 10, status: 404 });
    const range = await reader.recentRequests({ limit: 10, minStatus: 400 });

    expect(exact.requests).toMatchObject([{ uri: '/missing' }]);
    expect(range.requests).toMatchObject([{ uri: '/boom' }, { uri: '/missing' }]);
  });

  it('combines filters with AND', async () => {
    const { reader, recorder } = build();
    await recordRequest(recorder, { duration: 900, response_status: 500, uri: '/api/slow' });
    await recordRequest(recorder, { duration: 900, response_status: 200, uri: '/api/slow' });
    await recordRequest(recorder, { duration: 900, response_status: 500, uri: '/other' });

    const result = await reader.recentRequests({
      limit: 10,
      minDuration: 500,
      minStatus: 500,
      uriContains: '/api/',
    });

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]).toMatchObject({ response_status: 500, uri: '/api/slow' });
  });

  it('honours limit after filtering', async () => {
    const { reader, recorder } = build();
    await recordRequest(recorder, { response_status: 500 });
    await recordRequest(recorder, { response_status: 500 });

    expect((await reader.recentRequests({ limit: 1, minStatus: 500 })).requests).toHaveLength(1);
  });

  it('counts children per request', async () => {
    const { reader, recorder } = build();
    const parent = await recordRequest(recorder);
    await recorder.record('log', { level: LogLevel.INFO, message: 'hello', parent_id: parent });
    await recorder.record('query', {
      bindings: [],
      connection: 'bun:sqlite',
      parent_id: parent,
      query: 'SELECT 1',
      time: 1,
    });

    const result = await reader.recentRequests({ limit: 10 });

    expect(result.requests[0]).toMatchObject({
      counts: { exceptions: 0, logs: 1, outgoing: 0, queries: 1 },
    });
  });

  it('stops at MAX_SCAN and says so', async () => {
    const { reader, recorder } = build();
    for (let i = 0; i < MAX_SCAN + 1; i += 1) await recordRequest(recorder, { uri: `/n/${i}` });

    const result = await reader.recentRequests({ limit: 10, uriContains: 'no-such-path' });

    expect(result).toMatchObject({ scanLimitReached: true, scanned: MAX_SCAN });
    expect(result.requests).toHaveLength(0);
  });

  it('does not claim the scan limit was reached when the store is exhausted', async () => {
    const { reader, recorder } = build();
    for (let i = 0; i < MAX_SCAN; i += 1) await recordRequest(recorder, { uri: `/n/${i}` });

    const result = await reader.recentRequests({ limit: 10, uriContains: 'no-such-path' });

    expect(result).toMatchObject({ scanLimitReached: false, scanned: MAX_SCAN });
  });
});

describe('recentExceptions', () => {
  it("assembles the exception with its request and that request's other children", async () => {
    const { reader, recorder } = build();
    const parent = await recordRequest(recorder, { response_status: 500, uri: '/api/error' });
    await recorder.record('log', { level: LogLevel.INFO, message: 'before', parent_id: parent });
    await recorder.record('query', {
      bindings: [],
      connection: 'bun:sqlite',
      parent_id: parent,
      query: 'SELECT 1',
      time: 2,
    });
    await recorder.record('outgoing_request', {
      duration: 12,
      headers: {},
      method: 'GET',
      parent_id: parent,
      payload: {},
      response: {},
      response_headers: {},
      response_status: 200,
      uri: 'https://upstream.test/',
    });
    await recorder.record('exception', {
      class: ExceptionClass.ERROR,
      message: 'boom',
      parent_id: parent,
      trace: 'at handler',
    });

    const { exceptions } = await reader.recentExceptions(5);

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]).toMatchObject({
      logs: [{ message: 'before' }],
      message: 'boom',
      outgoing: [{ uri: 'https://upstream.test/' }],
      queries: [{ query: 'SELECT 1' }],
      request: { response_status: 500, uri: '/api/error' },
    });
  });

  it('omits the request and children for a parentless exception', async () => {
    const { reader, recorder } = build();
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
    const { reader, recorder } = build();
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
    const { reader, recorder } = build();
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
    const { reader, recorder } = build();
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
    const { reader, recorder } = build();
    const parent = await recorder.record('incoming_request', {
      duration: 9,
      headers: { authorization: '[REDACTED]' },
      method: 'POST',
      payload: { note: 'n'.repeat(MESSAGE_CAP + 50) },
      response: { id: 1 },
      response_headers: {},
      response_status: 201,
      uri: '/orders',
    });
    await recorder.record('log', { level: LogLevel.ERROR, message: 'oops', parent_id: parent });

    const detail = await reader.requestDetail(parent);

    expect(detail).toMatchObject({
      request: {
        headers: { authorization: '[REDACTED]' },
        logs: [{ message: 'oops' }],
        response: { id: 1 },
        uri: '/orders',
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
    const { reader, recorder } = build();
    const parent = await recordRequest(recorder, { uri: '/api/users/1' });
    for (const time of [3, 41, 7]) {
      await recorder.record('query', {
        bindings: [],
        connection: 'bun:sqlite',
        parent_id: parent,
        query: `SELECT ${time}`,
        time,
      });
    }

    const { queries } = await reader.slowQueries({ limit: 10, minMs: 0 });

    expect(queries.map((q) => (q as { time: number }).time)).toEqual([41, 7, 3]);
    expect(queries[0]).toMatchObject({ request: { uri: '/api/users/1' } });
  });

  it('carries the failure flag and message through to the agent', async () => {
    const { reader, recorder } = build();
    await recorder.record('query', {
      bindings: [],
      connection: 'mongodb',
      error: 'E11000 duplicate key',
      failed: true,
      query: 'app.insert',
      time: 9,
    });

    const { queries } = await reader.slowQueries({ limit: 10, minMs: 0 });

    expect(queries[0]).toMatchObject({ error: 'E11000 duplicate key', failed: true });
  });

  it('applies minMs and limit', async () => {
    const { reader, recorder } = build();
    for (const time of [1, 50, 80]) {
      await recorder.record('query', {
        bindings: [],
        connection: 'bun:sqlite',
        query: 'SELECT 1',
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
    const { reader, recorder } = build();
    await recordRequest(recorder);
    await recorder.record('log', { level: LogLevel.INFO, message: 'x' });

    expect(await reader.stats()).toEqual({
      exceptions: { total: 0 },
      incomingRequests: { total: 1 },
      logs: { total: 1 },
      outgoingRequests: { total: 0 },
      queries: { total: 0 },
    });
  });
});
