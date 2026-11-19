import { parseArgs } from 'node:util';

interface StdioArgs {
  headers: Record<string, string>;
  url: string;
}

export type ParsedStdioArgs = { args: StdioArgs; ok: true } | { message: string; ok: false };

const HEADER_SHAPE = "expected 'Name: value'";

const failure = (message: string): ParsedStdioArgs => ({ message, ok: false });

function addHeader(headers: Record<string, string>, raw: string): string | undefined {
  const separator = raw.indexOf(':');
  const name = separator === -1 ? '' : raw.slice(0, separator).trim().toLowerCase();
  const value = raw.slice(separator + 1).trim();

  if (name.length === 0 || value.length === 0) return `invalid header "${raw}", ${HEADER_SHAPE}`;

  headers[name] = value;

  return undefined;
}

export function parseStdioArgs(
  argv: string[],
  env: Record<string, string | undefined>
): ParsedStdioArgs {
  let values: { header?: string[]; url?: string };
  try {
    ({ values } = parseArgs({
      args: argv,
      options: { header: { multiple: true, type: 'string' }, url: { type: 'string' } },
      strict: true,
    }));
  } catch (error) {
    return failure(error instanceof Error ? error.message : String(error));
  }

  const headers: Record<string, string> = {};
  for (const raw of [env.TELESCOPE_HEADER, ...(values.header ?? [])]) {
    if (raw === undefined) continue;
    const problem = addHeader(headers, raw);
    if (problem !== undefined) return failure(problem);
  }

  const url = values.url ?? env.TELESCOPE_URL;

  if (url === undefined || url.length === 0) {
    return failure('no telescope endpoint given: pass --url or set TELESCOPE_URL');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return failure(`could not parse the url "${url}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return failure(`the url "${url}" must start with http:// or https://`);
  }

  return { args: { headers, url }, ok: true };
}
