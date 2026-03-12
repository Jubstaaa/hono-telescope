import { describe, it, expect } from 'vitest';
import { mapIncomingRequest, mapOutgoingRequest, mapException, mapLog, mapQuery } from './mappers';
import type {
  IncomingRequestEntry,
  OutgoingRequestEntry,
  ExceptionEntry,
  LogEntry,
  QueryEntry,
} from '@/types';

describe('mappers', () => {
  it('should map incoming request to slim response', () => {
    const entry: IncomingRequestEntry = {
      id: '1',
      timestamp: 1000,
      created_at: '2024-01-01T00:00:00Z',
      method: 'GET',
      uri: '/api/users',
      headers: { auth: 'token' },
      payload: { name: 'test' },
      response_status: 200,
      response_headers: { 'content-type': 'json' },
      response: { data: [] },
      duration: 50,
      ip_address: '127.0.0.1',
      user_agent: 'test',
    };

    const result = mapIncomingRequest(entry);

    expect(result).toEqual({
      id: '1',
      method: 'GET',
      uri: '/api/users',
      response_status: 200,
      created_at: '2024-01-01T00:00:00Z',
      duration: 50,
    });

    expect(result).not.toHaveProperty('headers');
    expect(result).not.toHaveProperty('payload');
    expect(result).not.toHaveProperty('response');
  });

  it('should map outgoing request to slim response', () => {
    const entry: OutgoingRequestEntry = {
      id: '2',
      timestamp: 1000,
      created_at: '2024-01-01T00:00:00Z',
      method: 'POST',
      uri: 'https://api.example.com',
      headers: {},
      payload: {},
      response_status: 201,
      response_headers: {},
      response: {},
      duration: 100,
      parent_id: 'parent-1',
    };

    const result = mapOutgoingRequest(entry);

    expect(result).toEqual({
      id: '2',
      method: 'POST',
      uri: 'https://api.example.com',
      response_status: 201,
      created_at: '2024-01-01T00:00:00Z',
      duration: 100,
    });
  });

  it('should map exception to slim response', () => {
    const entry: ExceptionEntry = {
      id: '3',
      timestamp: 1000,
      created_at: '2024-01-01T00:00:00Z',
      class: 3,
      message: 'TypeError: x is not a function',
      trace: 'stack trace here',
      parent_id: 'req-1',
    };

    const result = mapException(entry);

    expect(result).toEqual({
      id: '3',
      class: 3,
      message: 'TypeError: x is not a function',
      created_at: '2024-01-01T00:00:00Z',
    });

    expect(result).not.toHaveProperty('trace');
  });

  it('should map log to slim response', () => {
    const entry: LogEntry = {
      id: '4',
      timestamp: 1000,
      created_at: '2024-01-01T00:00:00Z',
      level: 1,
      message: 'Hello world',
      context: { args: ['hello'] },
      parent_id: 'req-2',
    };

    const result = mapLog(entry);

    expect(result).toEqual({
      id: '4',
      level: 1,
      message: 'Hello world',
      created_at: '2024-01-01T00:00:00Z',
    });

    expect(result).not.toHaveProperty('context');
  });

  it('should map query to slim response', () => {
    const entry: QueryEntry = {
      id: '5',
      timestamp: 1000,
      created_at: '2024-01-01T00:00:00Z',
      connection: 'sqlite',
      query: 'SELECT * FROM users',
      bindings: ['1'],
      time: 5,
      parent_id: 'req-3',
    };

    const result = mapQuery(entry);

    expect(result).toEqual({
      id: '5',
      connection: 'sqlite',
      query: 'SELECT * FROM users',
      time: 5,
      created_at: '2024-01-01T00:00:00Z',
    });

    expect(result).not.toHaveProperty('bindings');
  });
});
