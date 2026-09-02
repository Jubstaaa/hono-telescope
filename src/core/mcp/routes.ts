import type { Hono } from 'hono';

import { TELESCOPE_VERSION } from '../constants.js';
import type { Recorder } from '../recorder.js';

import {
  negotiate,
  parseRpc,
  requestedVersion,
  RPC_ERRORS,
  rpcError,
  rpcResult,
  SUPPORTED_PROTOCOL_VERSIONS,
} from './protocol.js';
import { createMcpReader } from './reader.js';
import { callTool, TOOL_DEFINITIONS } from './tools.js';

const SERVER_INFO = { name: 'hono-telescope', version: TELESCOPE_VERSION };

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
          requested: version.requested,
          supported: [...SUPPORTED_PROTOCOL_VERSIONS],
        })
      );
    }

    switch (call.method) {
      case 'initialize':
        return c.json(
          rpcResult(call.id, {
            capabilities: { tools: {} },
            protocolVersion: version.version,
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
            content: outcome.content,
            resultType: 'complete',
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
