# hono-telescope

[![npm version](https://badge.fury.io/js/hono-telescope.svg)](https://badge.fury.io/js/hono-telescope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Ready-black.svg)](https://bun.sh/)
[![Node.js](https://img.shields.io/badge/Node.js->=18.0.0-green.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/jubstaaa/hono-telescope?style=social)](https://github.com/jubstaaa/hono-telescope)
[![GitHub watchers](https://img.shields.io/github/watchers/jubstaaa/hono-telescope?style=social)](https://github.com/jubstaaa/hono-telescope)

A powerful debugging and monitoring tool for Hono applications, inspired by Laravel Telescope. Monitor HTTP requests, exceptions, logs, and database queries with a beautiful web dashboard.

---

## ✨ Features

**Currently Available:**

- 🔍 **HTTP Request Monitoring** - Track incoming requests with headers, payloads and response bodies, and outgoing `fetch` calls with headers and responses
- 🚨 **Exception Tracking** - Capture and monitor application errors with stack traces
- 📝 **Log Monitoring** - Monitor console logs with different severity levels
- 🗄️ **Database Query Monitoring** - Explicit per-client instrumentation for Prisma, Sequelize, MongoDB, and Bun SQLite with execution time
- 📊 **Beautiful Dashboard** - Modern React-based web interface with real-time updates
- 🎯 **Zero Configuration** - Works out of the box with sensible defaults
- 🏷️ **Tagging System** - Organize entries with custom tags and context
- 🔧 **TypeScript Support** - Full type definitions and type safety
- ⚡ **High Performance** - Minimal overhead with efficient memory management
- 🌐 **Bun & Node.js** - Works with both runtimes seamlessly
- 🗂️ **Multiple Database Support** - Integrates with popular database libraries
- ⚙️ **Zero Runtime Dependencies** - Depends only on Hono (peer dependency)

**Planned Features (Roadmap):**

- 💾 **Data Export** - Export monitored data in multiple formats (JSON, CSV)
- 🔔 **Alerts & Notifications** - Real-time alerts for errors and performance issues
- 📈 **Analytics & Reporting** - Advanced analytics and historical data analysis
- 🔐 **Authentication & Authorization** - Dashboard access control beyond basic auth
- 🌍 **Multi-Tenancy Support** - Support for multiple isolated projects
- 🧩 **Plugin System** - Extensible plugin architecture for custom integrations
- 🔄 **Data Persistence** - Optional database storage for long-term monitoring
- 📡 **MCP Server** - Model Context Protocol server for AI integration

## 📦 Installation

```bash
# Using npm
npm install hono-telescope

# Using yarn
yarn add hono-telescope

# Using pnpm
pnpm add hono-telescope

# Using bun
bun add hono-telescope
```

## Quick Start

```typescript
import { Hono } from 'hono';
import { createTelescope, memoryStorage } from 'hono-telescope';

const app = new Hono();
const telescope = createTelescope({ storage: memoryStorage({ maxEntries: 1000 }) });

app.use('*', telescope.middleware());
app.route('/telescope', telescope.dashboard());

export default app;
```

Visit `/telescope`. Telescope is on by default outside production and off inside it.

> 📋 **Complete Example**: See [src/example/index.ts](./src/example/index.ts) for a full working example with all Telescope features including database query monitoring, external request tracking, and error handling.

## Configuration

```typescript
import { createTelescope, memoryStorage, alsContext, consoleCollector } from 'hono-telescope';

const telescope = createTelescope({
  enabled: process.env.NODE_ENV !== 'production',
  storage: memoryStorage({ maxEntries: 1000 }),
  context: alsContext(),
  collectors: [consoleCollector()],
  dashboardPath: '/telescope',
  ignorePaths: ['/health'],
  ignoreStaticAssets: true,
  capture: {
    requestBody: true,
    responseBody: true,
    maxBodySize: 65536,
  },
  redact: {
    headers: ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'proxy-authorization'],
    bodyKeys: ['password', 'token', 'secret', 'apikey', 'authorization'],
  },
  dashboard: {
    auth: { username: 'admin', password: 'telescope' },
  },
});
```

All options are optional — `createTelescope()` works with the defaults.

| Key                    | Type                     | Default                                                                         | Notes                                                                           |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `enabled`              | `boolean`                | `NODE_ENV !== 'production'`                                                     | Disable in production by default                                                |
| `storage`              | `StorageAdapter`         | `memoryStorage({ maxEntries: 1000 })`                                           | In-memory storage with 1000 entry limit                                         |
| `context`              | `ContextStrategy`        | `alsContext()`                                                                  | AsyncLocalStorage-based request context tracking                                |
| `collectors`           | `Collector[]`            | `[consoleCollector(), exceptionCollector(), fetchCollector()]`                  | Default collectors for console, exceptions, and fetch; pass `[]` to disable all |
| `dashboardPath`        | `string`                 | `'/telescope'`                                                                  | Dashboard mount path; must match the path in `app.route()`                      |
| `ignorePaths`          | `string[]`               | `['.well-known']`                                                               | Paths to exclude from monitoring                                                |
| `ignoreStaticAssets`   | `boolean`                | `true`                                                                          | Skip monitoring requests for static files (.js, .css, .svg, etc.)               |
| `capture.requestBody`  | `boolean`                | `true`                                                                          | Capture incoming request bodies                                                 |
| `capture.responseBody` | `boolean`                | `true`                                                                          | Capture outgoing response bodies                                                |
| `capture.maxBodySize`  | `number`                 | `65536`                                                                         | Maximum bytes to capture per body (64 KB)                                       |
| `redact.headers`       | `string[]`               | `['authorization', 'cookie', 'set-cookie', 'x-api-key', 'proxy-authorization']` | Header names to redact                                                          |
| `redact.bodyKeys`      | `string[]`               | `['password', 'token', 'secret', 'apikey', 'authorization']`                    | Object keys to redact in request/response bodies                                |
| `dashboard.auth`       | `DashboardAuth \| false` | `undefined`                                                                     | Optional basic auth for dashboard; required if `enabled: true` in production    |

### Mounting at a Custom Path

If you mount the dashboard at a path other than `/telescope`, you **must** set `dashboardPath` to the same value:

```typescript
const telescope = createTelescope({ dashboardPath: '/admin/debug' });
app.route('/admin/debug', telescope.dashboard());
```

The middleware uses `dashboardPath` to avoid recording the dashboard's own traffic, and the dashboard uses it to construct its base URL.

## Database Queries

Pass your database client to Telescope for query instrumentation. Prisma returns a new client—use the returned one:

```typescript
import { createTelescope } from 'hono-telescope';
import { PrismaClient } from '@prisma/client';

const telescope = createTelescope();
const prisma = telescope.instrumentPrisma(new PrismaClient());
// Use the returned `prisma` client, not the original
```

Supported databases:

```typescript
const prisma = telescope.instrumentPrisma(new PrismaClient());
telescope.instrumentSequelize(sequelize);
const mongoClient = new MongoClient(url, { monitorCommands: true });
telescope.instrumentMongo(mongoClient);
telescope.instrumentBunSqlite(db);
```

> **Note**: Automatic database interception was removed in 1.0 because it never worked under Node ESM and captured only raw SQL where it did run. Explicit per-client instrumentation is now required.

Call each `instrument*` method **once per client**. Unlike the collectors, they are not
idempotent (only `instrumentBunSqlite` guards against double wrapping), so instrumenting the
same client twice records every query twice.

`instrumentBunSqlite` wraps the `query` and `prepare` statement factories, so statement calls
(`all`, `get`, `run`, `values`) are recorded. Queries issued directly on the database —
`db.exec`, `db.run`, `db.all`, `db.get` — are not captured.

## Security

The dashboard exposes request and response bodies, headers, and SQL. Telescope is therefore disabled when `NODE_ENV === 'production'`. If you enable it there anyway, you must supply `dashboard.auth`; mounting without it throws.

You have two options for production:

1. **Supply credentials** to protect the dashboard with basic auth:

```typescript
createTelescope({
  enabled: true,
  dashboard: { auth: { username: 'admin', password: 'secret' } },
});
```

2. **Explicitly opt out of auth** to acknowledge full exposure (no auth, dashboard fully open):

```typescript
createTelescope({
  enabled: true,
  dashboard: { auth: false },
});
```

Sensitive headers (`authorization`, `cookie`, `set-cookie`, `x-api-key`, `proxy-authorization`) and body keys (`password`, `token`, `secret`, `apikey`, `authorization`) are redacted by default, at any nesting depth. Redaction is recursive through nested objects and arrays, case-insensitive, and replaces values with `[REDACTED]` rather than deleting them.

## Limitations

- **Outgoing request bodies are not captured.** Outgoing `fetch` entries record the method,
  URL, headers, status and response body; the request payload panel stays empty.
- **Streamed responses are not captured.** Responses produced by Hono's `streamText` and
  `streamSSE` are recorded without a body, so that recording never buffers or delays a stream.
  Detection relies on the `Transfer-Encoding: chunked` header those helpers set (the bare
  `stream()` helper sets no content-type, so it is skipped too); a hand-rolled
  `new Response(readableStream, { headers: { 'content-type': 'text/plain' } })` sets neither
  header, so it is read and buffered before being recorded. Set `Transfer-Encoding: chunked`
  or a non-text content type on such a response to opt it out of capture.
- **Request and response bodies larger than `capture.maxBodySize` are recorded as metadata
  only** (`{ truncated: true, size }`), and a non-JSON `text/*` request body is recorded as
  `{ body: text }`.

## Custom Storage Adapters

Implement `StorageAdapter` and verify it against the contract suite that ships with the
package:

```typescript
import { runStorageContract } from 'hono-telescope/testing';
import { myStorage } from './my-storage';

runStorageContract('myStorage', () => myStorage());
```

The suite (a Vitest suite; run it with your own test runner installed) pins the two ordering
guarantees the dashboard relies on: `list` returns newest first, and `findByParent` returns
oldest first.

## Upgrading from 0.x

The 1.0 release introduces a new API centered on `createTelescope()`:

**0.x (Old API)**

```typescript
import { setupTelescope } from 'hono-telescope';

setupTelescope(app, {
  enabled: true,
  max_entries: 1000,
  sanitize_headers: ['authorization'],
});
```

**1.0 (New API)**

```typescript
import { createTelescope, memoryStorage } from 'hono-telescope';

const telescope = createTelescope({
  storage: memoryStorage({ maxEntries: 1000 }),
  redact: { headers: ['authorization'] },
});
app.use('*', telescope.middleware());
app.route('/telescope', telescope.dashboard());
```

**Key changes:**

- `setupTelescope(app, config)` is replaced by `createTelescope(config)` with explicit middleware and dashboard mounting
- Configuration keys are now camelCase (e.g., `max_entries` → `maxEntries`, `sanitize_headers` → `redact.headers`)
- Database interception is now explicit per-client; automatic interception was removed
- Axios interception was removed (axios on Node does not use `fetch`)
- A request whose handler throws is recorded with the status your own `onError` returned, and the exception is recorded as a child entry of that request

## Development

### Getting Started

First, install dependencies:

```bash
bun install
```

Then build the project for the first time:

```bash
bun run build
```

### Running in Development Mode

Start the TypeScript watcher and example app:

**Terminal 1 - TypeScript Compilation (Watch Mode)**

```bash
bun run dev
```

This watches for TypeScript changes and compiles them to JavaScript.

**Terminal 2 - Example Application**

```bash
bun run dev:example
```

This starts the example Hono application with hot reload at `http://localhost:3000`

- Example API endpoints: `http://localhost:3000/api/...`
- Dashboard: `http://localhost:3000/telescope`

Test all endpoints at once with the test script:

```bash
bash src/example/test-all-endpoints.sh
```

This will automatically test all endpoints and populate the dashboard with data.

## License

[MIT](LICENSE)
