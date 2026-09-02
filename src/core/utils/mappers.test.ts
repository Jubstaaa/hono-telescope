import { describe, expect, it } from 'vitest';

import type {
  ExceptionEntry,
  IncomingRequestEntry,
  LogEntry,
  OutgoingRequestEntry,
  QueryEntry,
} from '../../types/index.js';

import {
  mapException,
  mapIncomingRequest,
  mapLog,
  mapOutgoingRequest,
  mapQuery,
} from './mappers.js';

describe('mappers', () => {
  it('should map incoming request to slim response', () => {
    const entry: IncomingRequestEntry = {
      created_at: '2024-01-01T00:00:00Z',
      duration: 50,
      headers: { auth: 'token' },
      id: '1',
      ip_address: '127.0.0.1',
      method: 'GET',
      payload: { name: 'test' },
      response: { data: [] },
      response_headers: { 'content-type': 'json' },
      response_status: 200,
      timestamp: 1000,
      uri: '/api/users',
      user_agent: 'test',
    };

    const result = mapIncomingRequest(entry);

    expect(result).toEqual({
      created_at: '2024-01-01T00:00:00Z',
      duration: 50,
      id: '1',
      method: 'GET',
      response_status: 200,
      uri: '/api/users',
    });

    expect(result).not.toHaveProperty('headers');
    expect(result).not.toHaveProperty('payload');
    expect(result).not.toHaveProperty('response');
  });

  it('should map outgoing request to slim response', () => {
    const entry: OutgoingRequestEntry = {
      created_at: '2024-01-01T00:00:00Z',
      duration: 100,
      headers: {},
      id: '2',
      method: 'POST',
      parent_id: 'parent-1',
      payload: {},
      response: {},
      response_headers: {},
      response_status: 201,
      timestamp: 1000,
      uri: 'https://api.example.com',
    };

    const result = mapOutgoingRequest(entry);

    expect(result).toEqual({
      created_at: '2024-01-01T00:00:00Z',
      duration: 100,
      id: '2',
      method: 'POST',
      response_status: 201,
      uri: 'https://api.example.com',
    });
  });

  it('should map exception to slim response', () => {
    const entry: ExceptionEntry = {
      class: 3,
      created_at: '2024-01-01T00:00:00Z',
      id: '3',
      message: 'TypeError: x is not a function',
      parent_id: 'req-1',
      timestamp: 1000,
      trace: 'stack trace here',
    };

    const result = mapException(entry);

    expect(result).toEqual({
      class: 3,
      created_at: '2024-01-01T00:00:00Z',
      id: '3',
      message: 'TypeError: x is not a function',
    });

    expect(result).not.toHaveProperty('trace');
  });

  it('should map log to slim response', () => {
    const entry: LogEntry = {
      context: { args: ['hello'] },
      created_at: '2024-01-01T00:00:00Z',
      id: '4',
      level: 1,
      message: 'Hello world',
      parent_id: 'req-2',
      timestamp: 1000,
    };

    const result = mapLog(entry);

    expect(result).toEqual({
      created_at: '2024-01-01T00:00:00Z',
      id: '4',
      level: 1,
      message: 'Hello world',
    });

    expect(result).not.toHaveProperty('context');
  });

  it('should map query to slim response', () => {
    const entry: QueryEntry = {
      bindings: ['1'],
      connection: 'sqlite',
      created_at: '2024-01-01T00:00:00Z',
      id: '5',
      parent_id: 'req-3',
      query: 'SELECT * FROM users',
      time: 5,
      timestamp: 1000,
    };

    const result = mapQuery(entry);

    expect(result).toEqual({
      connection: 'sqlite',
      created_at: '2024-01-01T00:00:00Z',
      id: '5',
      query: 'SELECT * FROM users',
      time: 5,
    });

    expect(result).not.toHaveProperty('bindings');
  });
});
