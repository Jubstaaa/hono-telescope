#!/usr/bin/env node
import { TELESCOPE_VERSION } from '../core/constants.js';

import { parseStdioArgs } from './args.js';
import { runStdioBridge } from './stdio-bridge.js';

const USAGE = `hono-telescope ${TELESCOPE_VERSION}

Usage
  hono-telescope mcp-stdio --url <endpoint> [--header 'Name: value']...

Bridges a stdio-only MCP client to the MCP endpoint an instrumented app already serves.
Reads one JSON-RPC message per line on stdin, forwards it to the endpoint over HTTP, and
writes the reply as one line on stdout.

Options
  --url <endpoint>   Where the app serves MCP, e.g. http://localhost:3000/telescope/mcp.
                     Falls back to TELESCOPE_URL.
  --header <header>  A header sent with every request, repeatable. Use it for a dashboard
                     protected by basic auth. Falls back to TELESCOPE_HEADER.
  -h, --help         Print this help.
  -v, --version      Print the package version.

Example
  claude mcp add telescope -- npx -y hono-telescope mcp-stdio \\
    --url http://localhost:3000/telescope/mcp
`;

async function mcpStdio(argv: string[]): Promise<void> {
  const parsed = parseStdioArgs(argv, process.env);

  if (!parsed.ok) {
    console.error(`hono-telescope mcp-stdio: ${parsed.message}\n\n${USAGE}`);
    process.exitCode = 1;

    return;
  }

  const { headers, url } = parsed.args;

  await runStdioBridge({
    input: process.stdin,
    post: async (body) => {
      const response = await fetch(url, {
        body,
        headers: { 'content-type': 'application/json', ...headers },
        method: 'POST',
      });

      return { body: await response.text(), status: response.status };
    },
    writeLine: (line) => {
      process.stdout.write(`${line}\n`);
    },
  });
}

async function main(): Promise<void> {
  const [subcommand, ...rest] = process.argv.slice(2);

  switch (subcommand) {
    case '-h':
    case '--help':
    case undefined:
      process.stdout.write(USAGE);

      return;

    case '-v':
    case '--version':
      process.stdout.write(`${TELESCOPE_VERSION}\n`);

      return;

    case 'mcp-stdio':
      return mcpStdio(rest);

    default:
      console.error(`hono-telescope: unknown command "${subcommand}"\n\n${USAGE}`);
      process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error(`hono-telescope: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
