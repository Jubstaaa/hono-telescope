import { describe, it, expect, beforeEach } from 'vitest';
import { Telescope } from './telescope';

describe('Telescope', () => {
  beforeEach(async () => {
    const instance = Telescope.getInstance({ max_entries: 100 });
    await instance.clearAllData();
  });

  it('should be a singleton', () => {
    const a = Telescope.getInstance();
    const b = Telescope.getInstance();
    expect(a).toBe(b);
  });

  it('should record and retrieve incoming requests', async () => {
    const telescope = Telescope.getInstance();

    const id = await telescope.recordIncomingRequest({
      method: 'GET',
      uri: '/api/users',
      headers: { 'content-type': 'application/json' },
      payload: {},
      response_status: 200,
      response_headers: {},
      response: { data: [] },
      duration: 50,
      ip_address: '127.0.0.1',
      user_agent: 'test',
    });

    expect(id).toBeDefined();

    const entry = await telescope.getIncomingRequest(id);
    expect(entry).not.toBeNull();
    expect(entry!.method).toBe('GET');
    expect(entry!.uri).toBe('/api/users');
    expect(entry!.response_status).toBe(200);
    expect(entry!.duration).toBe(50);
  });

  it('should record incoming request with custom id', async () => {
    const telescope = Telescope.getInstance();
    const customId = 'custom-request-id';

    const id = await telescope.recordIncomingRequest(
      {
        method: 'POST',
        uri: '/api/users',
        headers: {},
        payload: { name: 'test' },
        response_status: 201,
        response_headers: {},
        response: {},
        duration: 100,
      },
      customId
    );

    expect(id).toBe(customId);
  });

  it('should record and retrieve outgoing requests', async () => {
    const telescope = Telescope.getInstance();

    const id = await telescope.recordOutgoingRequest({
      method: 'GET',
      uri: 'https://api.example.com/data',
      headers: {},
      payload: {},
      response_status: 200,
      response_headers: {},
      response: {},
      duration: 150,
      parent_id: 'parent-123',
    });

    const entry = await telescope.getOutgoingRequest(id);
    expect(entry).not.toBeNull();
    expect(entry!.uri).toBe('https://api.example.com/data');

    const byParent = await telescope.getOutgoingRequestsByParentId('parent-123');
    expect(byParent).toHaveLength(1);
  });

  it('should record and retrieve exceptions', async () => {
    const telescope = Telescope.getInstance();

    const id = await telescope.recordException({
      class: 0,
      message: 'Test error',
      trace: 'Error: Test error\n    at test.ts:1',
      parent_id: 'req-1',
    });

    const entry = await telescope.getException(id);
    expect(entry).not.toBeNull();
    expect(entry!.message).toBe('Test error');

    const byParent = await telescope.getExceptionsByParentId('req-1');
    expect(byParent).toHaveLength(1);
  });

  it('should record and retrieve logs', async () => {
    const telescope = Telescope.getInstance();

    const id = await telescope.recordLog({
      level: 1,
      message: 'Test log message',
      context: { args: ['hello'] },
      parent_id: 'req-2',
    });

    const entry = await telescope.getLog(id);
    expect(entry).not.toBeNull();
    expect(entry!.message).toBe('Test log message');
    expect(entry!.level).toBe(1);
  });

  it('should record and retrieve queries', async () => {
    const telescope = Telescope.getInstance();

    const id = await telescope.recordQuery({
      connection: 'sqlite',
      query: 'SELECT * FROM users',
      bindings: [],
      time: 5,
      parent_id: 'req-3',
    });

    const entry = await telescope.getQuery(id);
    expect(entry).not.toBeNull();
    expect(entry!.query).toBe('SELECT * FROM users');

    const byParent = await telescope.getQueriesByParentId('req-3');
    expect(byParent).toHaveLength(1);
  });

  it('should count entries correctly', async () => {
    const telescope = Telescope.getInstance();

    await telescope.recordIncomingRequest({
      method: 'GET',
      uri: '/test',
      headers: {},
      payload: {},
      response_status: 200,
      response_headers: {},
      response: {},
      duration: 10,
    });

    await telescope.recordException({
      class: 0,
      message: 'err',
      trace: '',
    });

    expect(await telescope.countIncomingRequests()).toBe(1);
    expect(await telescope.countExceptions()).toBe(1);
    expect(await telescope.countOutgoingRequests()).toBe(0);
    expect(await telescope.countLogs()).toBe(0);
    expect(await telescope.countQueries()).toBe(0);
  });

  it('should clear all data', async () => {
    const telescope = Telescope.getInstance();

    await telescope.recordIncomingRequest({
      method: 'GET',
      uri: '/test',
      headers: {},
      payload: {},
      response_status: 200,
      response_headers: {},
      response: {},
      duration: 10,
    });

    await telescope.recordLog({ level: 1, message: 'log' });

    await telescope.clearAllData();

    expect(await telescope.countIncomingRequests()).toBe(0);
    expect(await telescope.countLogs()).toBe(0);
  });

  it('should return null for non-existent entries', async () => {
    const telescope = Telescope.getInstance();

    expect(await telescope.getIncomingRequest('non-existent')).toBeNull();
    expect(await telescope.getOutgoingRequest('non-existent')).toBeNull();
    expect(await telescope.getException('non-existent')).toBeNull();
    expect(await telescope.getLog('non-existent')).toBeNull();
    expect(await telescope.getQuery('non-existent')).toBeNull();
  });
});
