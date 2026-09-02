import { describe, expect, it } from 'vitest';

import { parseStdioArgs } from './args.js';

const URL_OK = 'http://localhost:3000/telescope/mcp';

const expectOk = (parsed: ReturnType<typeof parseStdioArgs>) => {
  if (!parsed.ok) throw new Error(`expected success, got: ${parsed.message}`);

  return parsed.args;
};

const expectFailure = (parsed: ReturnType<typeof parseStdioArgs>) => {
  if (parsed.ok) throw new Error('expected a failure');

  return parsed.message;
};

describe('parseStdioArgs', () => {
  it('reads the url from --url', () => {
    expect(expectOk(parseStdioArgs(['--url', URL_OK], {})).url).toBe(URL_OK);
  });

  it('reads the url from --url=', () => {
    expect(expectOk(parseStdioArgs([`--url=${URL_OK}`], {})).url).toBe(URL_OK);
  });

  it('reads the url from TELESCOPE_URL', () => {
    expect(expectOk(parseStdioArgs([], { TELESCOPE_URL: URL_OK })).url).toBe(URL_OK);
  });

  it('prefers the flag over the environment', () => {
    const args = expectOk(
      parseStdioArgs(['--url', URL_OK], { TELESCOPE_URL: 'http://elsewhere/mcp' })
    );

    expect(args.url).toBe(URL_OK);
  });

  it('reports a missing url', () => {
    expect(expectFailure(parseStdioArgs([], {}))).toContain('--url');
  });

  it('reports a url that is missing its scheme', () => {
    // `new URL('localhost:3000/mcp')` parses with protocol `localhost:` instead of throwing.
    expect(expectFailure(parseStdioArgs(['--url', 'localhost:3000/mcp'], {}))).toContain('http');
  });

  it('reports a url that cannot be parsed', () => {
    expect(expectFailure(parseStdioArgs(['--url', ':::'], {}))).toContain(':::');
  });

  it('defaults to no headers', () => {
    expect(expectOk(parseStdioArgs(['--url', URL_OK], {})).headers).toEqual({});
  });

  it('collects repeatable headers and lowercases their names', () => {
    const args = expectOk(
      parseStdioArgs(
        ['--url', URL_OK, '--header', 'Authorization: Basic abc', '--header=X-Api-Key: k'],
        {}
      )
    );

    expect(args.headers).toEqual({ authorization: 'Basic abc', 'x-api-key': 'k' });
  });

  it('keeps a header value that contains a colon intact', () => {
    const args = expectOk(parseStdioArgs(['--url', URL_OK, '--header', 'X-Trace: a:b:c'], {}));

    expect(args.headers['x-trace']).toBe('a:b:c');
  });

  it('reads a single header from TELESCOPE_HEADER', () => {
    const args = expectOk(
      parseStdioArgs(['--url', URL_OK], { TELESCOPE_HEADER: 'Authorization: Bearer t' })
    );

    expect(args.headers).toEqual({ authorization: 'Bearer t' });
  });

  it('lets a flag header override the environment header of the same name', () => {
    const args = expectOk(
      parseStdioArgs(['--url', URL_OK, '--header', 'authorization: flag'], {
        TELESCOPE_HEADER: 'Authorization: env',
      })
    );

    expect(args.headers).toEqual({ authorization: 'flag' });
  });

  it('reports a header without a colon', () => {
    expect(expectFailure(parseStdioArgs(['--url', URL_OK, '--header', 'nope'], {}))).toContain(
      'Name: value'
    );
  });

  it('reports a header with an empty name', () => {
    expect(expectFailure(parseStdioArgs(['--url', URL_OK, '--header', ': v'], {}))).toContain(
      'Name: value'
    );
  });

  it('reports a flag that is missing its value', () => {
    expect(expectFailure(parseStdioArgs(['--url'], {}))).toContain('--url');
  });

  it('reports an unknown flag', () => {
    expect(expectFailure(parseStdioArgs(['--url', URL_OK, '--verbose'], {}))).toContain(
      '--verbose'
    );
  });

  it('reports a stray positional argument', () => {
    expect(expectFailure(parseStdioArgs(['--url', URL_OK, 'extra'], {}))).toContain('extra');
  });
});
