import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from './memory-storage';
import type { IncomingRequestEntry } from '@/types';

const createEntry = (overrides: Partial<IncomingRequestEntry> = {}): IncomingRequestEntry => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  created_at: new Date().toISOString(),
  method: 'GET',
  uri: '/test',
  headers: {},
  payload: {},
  response_status: 200,
  response_headers: {},
  response: {},
  duration: 10,
  ...overrides,
});

describe('MemoryStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(5);
  });

  it('should create and retrieve entries', async () => {
    const entry = createEntry({ id: 'test-1' });
    await storage.incomingRequests.create(entry);

    const found = await storage.incomingRequests.findById('test-1');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('test-1');
  });

  it('should find entries by parent_id', async () => {
    const entry1 = createEntry({ id: 'e1', parent_id: 'parent-1' });
    const entry2 = createEntry({ id: 'e2', parent_id: 'parent-1' });
    const entry3 = createEntry({ id: 'e3', parent_id: 'parent-2' });

    await storage.incomingRequests.create(entry1);
    await storage.incomingRequests.create(entry2);
    await storage.incomingRequests.create(entry3);

    const results = await storage.incomingRequests.findByParentId('parent-1');
    expect(results).toHaveLength(2);
  });

  it('should trim entries when exceeding max_entries', async () => {
    for (let i = 0; i < 8; i++) {
      await storage.incomingRequests.create(createEntry({ id: `entry-${i}` }));
    }

    const all = await storage.incomingRequests.findAll();
    expect(all.length).toBeLessThanOrEqual(5);

    const oldest = await storage.incomingRequests.findById('entry-0');
    expect(oldest).toBeNull();

    const newest = await storage.incomingRequests.findById('entry-7');
    expect(newest).not.toBeNull();
  });

  it('should count entries', async () => {
    expect(await storage.incomingRequests.count()).toBe(0);

    await storage.incomingRequests.create(createEntry());
    await storage.incomingRequests.create(createEntry());

    expect(await storage.incomingRequests.count()).toBe(2);
  });

  it('should clear entries', async () => {
    await storage.incomingRequests.create(createEntry());
    await storage.incomingRequests.create(createEntry());

    await storage.incomingRequests.clear();

    expect(await storage.incomingRequests.count()).toBe(0);
  });

  it('should return null for non-existent entry', async () => {
    const result = await storage.incomingRequests.findById('does-not-exist');
    expect(result).toBeNull();
  });

  it('should return empty array for non-existent parent_id', async () => {
    const results = await storage.incomingRequests.findByParentId('no-parent');
    expect(results).toEqual([]);
  });
});
