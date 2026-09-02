import { RPC_ERRORS, rpcError } from '../core/mcp/protocol.js';

export interface PostResult {
  body: string;
  status: number;
}

export interface StdioBridgeIo {
  input: AsyncIterable<string | Uint8Array>;
  post: (body: string) => Promise<PostResult>;
  writeLine: (line: string) => void;
}

const SNIPPET_LIMIT = 200;

const WRONG_URL_HINT = ' Is --url pointing at the dashboard instead of its /mcp endpoint?';

const looksLikeHtml = (body: string) => body.trimStart().startsWith('<');

function describeBody(body: string): string {
  if (looksLikeHtml(body)) return 'an HTML page';

  return body.length > SNIPPET_LIMIT ? `${body.slice(0, SNIPPET_LIMIT)}...` : body;
}

// A 404 carries no html to sniff — Hono answers a POST to the dashboard root with plain text —
// yet it is the shape a mistyped path takes almost every time.
const wrongUrlHint = (body: string, status?: number) =>
  status === 404 || looksLikeHtml(body) ? WRONG_URL_HINT : '';

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

function requestId(line: string): number | string | null {
  try {
    const parsed: unknown = JSON.parse(line);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { id } = parsed as Record<string, unknown>;

    return typeof id === 'string' || typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}

function fail(io: StdioBridgeIo, line: string, message: string): void {
  console.error(`hono-telescope mcp-stdio: ${message}`);

  const id = requestId(line);
  if (id === null) return;

  io.writeLine(JSON.stringify(rpcError(id, RPC_ERRORS.internal, message)));
}

async function relay(io: StdioBridgeIo, line: string): Promise<void> {
  let result: PostResult;
  try {
    result = await io.post(line);
  } catch (error) {
    fail(io, line, `could not reach the telescope endpoint: ${reason(error)}`);

    return;
  }

  if (result.status < 200 || result.status >= 300) {
    fail(
      io,
      line,
      `the telescope endpoint answered ${result.status}: ${describeBody(result.body)}.` +
        wrongUrlHint(result.body, result.status)
    );

    return;
  }

  const body = result.body.trim();
  if (body.length === 0) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    fail(
      io,
      line,
      `the telescope endpoint answered with a non-JSON body: ${describeBody(body)}.` +
        wrongUrlHint(body)
    );

    return;
  }

  io.writeLine(JSON.stringify(parsed));
}

export async function runStdioBridge(io: StdioBridgeIo): Promise<void> {
  const decoder = new TextDecoder();
  const inFlight = new Set<Promise<void>>();
  let buffer = '';

  const dispatch = (line: string) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;

    const task = relay(io, trimmed);
    inFlight.add(task);
    void task.finally(() => inFlight.delete(task));
  };

  for await (const chunk of io.input) {
    buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });

    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      dispatch(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf('\n');
    }
  }

  dispatch(buffer);

  await Promise.all([...inFlight]);
}
