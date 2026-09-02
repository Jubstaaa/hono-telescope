export interface StdioArgs {
  headers: Record<string, string>;
  url: string;
}

export type ParsedStdioArgs = { args: StdioArgs; ok: true } | { message: string; ok: false };

const FLAGS = ['--url', '--header'] as const;

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
  const headers: Record<string, string> = {};
  let url = env.TELESCOPE_URL;

  if (env.TELESCOPE_HEADER !== undefined) {
    const problem = addHeader(headers, env.TELESCOPE_HEADER);
    if (problem !== undefined) return failure(problem);
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const equals = arg.startsWith('--') ? arg.indexOf('=') : -1;
    const flag = equals === -1 ? arg : arg.slice(0, equals);

    if (!FLAGS.includes(flag as (typeof FLAGS)[number])) {
      return failure(
        arg.startsWith('-') ? `unknown flag "${arg}"` : `unexpected argument "${arg}"`
      );
    }

    let value = equals === -1 ? undefined : arg.slice(equals + 1);
    if (value === undefined) {
      index += 1;
      value = argv[index];
    }

    if (value === undefined || value.length === 0) return failure(`${flag} needs a value`);

    if (flag === '--url') {
      url = value;
      continue;
    }

    const problem = addHeader(headers, value);
    if (problem !== undefined) return failure(problem);
  }

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
