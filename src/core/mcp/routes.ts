import type { Hono } from 'hono';
import type { Recorder } from '../recorder.js';
import {
  RPC_ERRORS,
  SUPPORTED_PROTOCOL_VERSIONS,
  negotiate,
  parseRpc,
  requestedVersion,
  rpcError,
  rpcResult,
} from './protocol.js';
import { createMcpReader } from './reader.js';
import { TOOL_DEFINITIONS, callTool } from './tools.js';

const SERVER_INFO = { name: 'hono-telescope', version: '1.0.0' };

export function mountMcp(app: Hono, recorder: Recorder): void {
  const reader = createMcpReader(recorder);

  app.on(['GET', 'DELETE'], '/mcp', (c) =>
    c.json({ error: 'Method Not Allowed. This endpoint accepts POST only.' }, 405)
  );

  app.post('/mcp', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(rpcError(null, RPC_ERRORS.parse, 'Parse error'));
    }

    const parsed = parseRpc(body);
    if (parsed.kind === 'notification') return c.body(null, 202);
    if (parsed.kind === 'invalid') return c.json(rpcError(null, parsed.code, parsed.message));

    const { call } = parsed;
    const version = negotiate(requestedVersion(call, c.req.header('MCP-Protocol-Version')));
    if (!version.ok) {
      return c.json(
        rpcError(call.id, RPC_ERRORS.unsupportedProtocolVersion, 'Unsupported protocol version', {
          supported: [...SUPPORTED_PROTOCOL_VERSIONS],
          requested: version.requested,
        })
      );
    }

    switch (call.method) {
      case 'initialize':
        return c.json(
          rpcResult(call.id, {
            protocolVersion: version.version,
            capabilities: { tools: {} },
            serverInfo: SERVER_INFO,
          })
        );

      case 'ping':
        return c.json(rpcResult(call.id, {}));

      case 'tools/list':
        return c.json(rpcResult(call.id, { resultType: 'complete', tools: [...TOOL_DEFINITIONS] }));

      case 'tools/call': {
        const outcome = await callTool(reader, call.params.name, call.params.arguments);
        if (outcome.kind === 'invalidParams') {
          return c.json(rpcError(call.id, RPC_ERRORS.invalidParams, outcome.message));
        }

        return c.json(
          rpcResult(call.id, {
            resultType: 'complete',
            content: outcome.content,
            structuredContent: outcome.structuredContent,
            ...(outcome.isError === undefined ? {} : { isError: outcome.isError }),
          })
        );
      }

      default:
        return c.json(
          rpcError(call.id, RPC_ERRORS.methodNotFound, `Method not found: ${call.method}`)
        );
    }
  });
}
