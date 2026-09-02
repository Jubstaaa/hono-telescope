import { describe, expect, it } from 'vitest';

import { ExceptionClass } from '../../types/index.js';
import { alsContext } from '../context/als-context.js';
import { Recorder } from '../recorder.js';
import { memoryStorage } from '../storage/memory-storage.js';

import { createMcpReader } from './reader.js';
import { callTool, TOOL_DEFINITIONS } from './tools.js';

function build() {
  const recorder = new Recorder(memoryStorage(), alsContext());
  return { reader: createMcpReader(recorder), recorder };
}

describe('TOOL_DEFINITIONS', () => {
  it('documents every input parameter, so a client never sees a bare schema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      const properties = (tool.inputSchema as { properties: Record<string, unknown> }).properties;

      for (const [parameter, schema] of Object.entries(properties)) {
        const { description } = schema as { description?: string };

        expect(description, `${tool.name}.${parameter} has no description`).toBeTruthy();
      }
    }
  });

  it('annotates every tool as read-only and closed-world', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.annotations, tool.name).toEqual({ openWorldHint: false, readOnlyHint: true });
    }
  });

  it('declares the five read-only tools', () => {
    expect(TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
      'recent_exceptions',
      'recent_requests',
      'request_detail',
      'slow_queries',
      'stats',
    ]);
  });

  it('gives every tool a title, a description and an object input schema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toMatchObject({ type: 'object' });
    }
  });

  it('exposes no tool that mutates', () => {
    const names = TOOL_DEFINITIONS.map((tool) => tool.name).join(' ');

    expect(names).not.toMatch(/clear|delete|record|write/);
  });
});

describe('callTool', () => {
  it('rejects an unknown tool with invalidParams', async () => {
    const { reader } = build();

    expect(await callTool(reader, 'nope', {})).toMatchObject({ kind: 'invalidParams' });
  });

  it('rejects a non-string tool name', async () => {
    const { reader } = build();

    expect(await callTool(reader, 7, {})).toMatchObject({ kind: 'invalidParams' });
  });

  it('returns content and structuredContent that agree', async () => {
    const { reader } = build();

    const outcome = await callTool(reader, 'stats', {});

    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') return;
    expect(JSON.parse(outcome.content[0].text)).toEqual(outcome.structuredContent);
    expect(outcome.structuredContent).toMatchObject({ logs: { total: 0 } });
  });

  it('applies the default limit for recent_exceptions', async () => {
    const { reader, recorder } = build();
    for (let i = 0; i < 8; i += 1) {
      await recorder.record('exception', {
        class: ExceptionClass.ERROR,
        message: `e${i}`,
        trace: 't',
      });
    }

    const outcome = await callTool(reader, 'recent_exceptions', {});

    if (outcome.kind !== 'ok') throw new Error('expected ok');
    expect((outcome.structuredContent as { exceptions: unknown[] }).exceptions).toHaveLength(5);
  });

  it.each([
    ['a non-integer limit', 'recent_exceptions', { limit: 1.5 }],
    ['a zero limit', 'recent_exceptions', { limit: 0 }],
    ['a limit above the max', 'recent_exceptions', { limit: 51 }],
    ['a non-number status', 'recent_requests', { status: 'x' }],
    ['a non-string uriContains', 'recent_requests', { uriContains: 5 }],
    ['a missing id', 'request_detail', {}],
    ['a non-string id', 'request_detail', { id: 5 }],
    ['a negative minMs', 'slow_queries', { minMs: -1 }],
  ])('rejects %s', async (_label, name, args) => {
    const { reader } = build();

    expect(await callTool(reader, name, args)).toMatchObject({ kind: 'invalidParams' });
  });

  it('returns isError rather than throwing for an unknown request id', async () => {
    const { reader } = build();

    const outcome = await callTool(reader, 'request_detail', { id: 'missing' });

    expect(outcome).toMatchObject({ isError: true, kind: 'ok' });
  });

  it('returns isError when the reader throws', async () => {
    const reader = {
      ...createMcpReader(new Recorder(memoryStorage(), alsContext())),
      stats: () => Promise.reject(new Error('storage exploded')),
    };

    const outcome = await callTool(reader, 'stats', {});

    expect(outcome).toMatchObject({ isError: true, kind: 'ok' });
    if (outcome.kind !== 'ok') return;
    expect(outcome.content[0].text).toContain('storage exploded');
  });
});
