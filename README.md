# hono-telescope

[![npm version](https://badge.fury.io/js/@hono%2Ftelescope.svg)](https://badge.fury.io/js/@hono%2Ftelescope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> **⚠️ Beta Release**: This package is currently in beta. APIs may change before the stable release.

A powerful debugging and monitoring tool for Hono applications, inspired by Laravel Telescope. Monitor HTTP requests, exceptions, logs, and database queries with a beautiful web dashboard.

> 📚 **Monorepo Structure**: This project uses Turborepo! For detailed workspace information, see [MONOREPO.md](./MONOREPO.md).

## ✨ Features

- 🔍 **HTTP Request Monitoring** - Track all incoming and outgoing requests
- 🚨 **Exception Tracking** - Capture and monitor application errors
- 📝 **Log Monitoring** - Monitor console logs with different levels
- 🗄️ **Database Query Monitoring** - Track SQL queries and performance
- 📊 **Beautiful Dashboard** - Modern React-based web interface
- 🎯 **Zero Configuration** - Works out of the box with sensible defaults
- 🏷️ **Tagging System** - Organize entries with custom tags
- 🔧 **TypeScript Support** - Full type definitions included
- ⚡ **High Performance** - Minimal overhead on your application
- 🌐 **Bun & Node.js** - Works with both runtimes

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
import { setupTelescope, startExceptionWatcher, startLogWatcher } from 'hono-telescope';

const app = new Hono();

// Setup Telescope with default configuration
setupTelescope(app);

// Start watchers
startExceptionWatcher();
startLogWatcher();

// Your routes
app.get('/', (c) => {
  console.log('Home page accessed');
  return c.json({ message: 'Hello World!' });
});

export default app;
```

Visit `http://localhost:3000/telescope` to access the dashboard.

## Configuration

```typescript
import { setupTelescope } from 'hono-telescope';

setupTelescope(app, {
  enabled: true,                    // Enable/disable Telescope
  path: '/telescope',               // Dashboard path
  max_entries: 1000,               // Maximum entries to store
  ignored_paths: ['/health'],      // Paths to ignore
  watchers: {
    requests: true,                 // Monitor HTTP requests
    exceptions: true,               // Monitor exceptions
    logs: true,                     // Monitor logs
    queries: true                   // Monitor database queries
  }
});
```

## Watchers

### Exception Watcher

Monitors uncaught exceptions, unhandled promise rejections, and console errors:

```typescript
import { startExceptionWatcher, stopExceptionWatcher } from 'hono-telescope';

// Start monitoring exceptions
startExceptionWatcher();

// Stop monitoring (if needed)
stopExceptionWatcher();
```

### Log Watcher

Captures console.log, console.warn, console.error, and console.info calls:

```typescript
import { startLogWatcher, stopLogWatcher } from 'hono-telescope';

// Start monitoring logs
startLogWatcher();

// Your logs will be captured
console.log('This will appear in Telescope');
console.error('This error will be tracked');
```

### Query Watcher

Monitors database queries (basic SQL pattern detection + manual recording):

```typescript
import { startQueryWatcher, recordDatabaseQuery } from 'hono-telescope';

// Start automatic SQL pattern detection
startQueryWatcher();

// Manually record database queries
recordDatabaseQuery(
  'SELECT * FROM users WHERE email = ?',
  ['user@example.com'],
  45, // execution time in ms
  'main' // connection name
);
```

### Axios Interceptor

To monitor outgoing HTTP requests made with Axios, you need to make Axios globally accessible:

```typescript
import axios from 'axios';
import { setupTelescope } from 'hono-telescope';

// Make axios globally accessible for the interceptor
(globalThis as any).axios = axios;

// Setup Telescope - this will automatically detect and intercept Axios requests
setupTelescope(app);

// Your Axios requests will now be captured in Telescope
const response = await axios.get('https://api.example.com/users');
```

**Important**: The Axios interceptor requires Axios to be available in the global scope. Make sure to assign your Axios instance to `globalThis.axios` before calling `setupTelescope()`.

## Dashboard Features

### Request Monitoring
- HTTP method, URL, status code
- Request/response headers and body
- Response time usage
- IP address and user agent

### Exception Tracking
- Exception class and message
- Full stack trace
- File and line number
- Automatic grouping by exception type

### Log Monitoring
- Log level (info, warn, error, debug)
- Message and context
- Timestamp and stack trace
- Filterable by log level

### Query Monitoring
- SQL queries with syntax highlighting
- Execution time and slow query detection
- Parameter bindings
- Connection information

### Performance Metrics
- Response time distribution
- Request count by status code
- Average response times

## API Reference

### Core Classes

#### Telescope
```typescript
import { Telescope } from 'hono-telescope';

const telescope = Telescope.getInstance();

// Record custom entries
telescope.record(EntryType.LOG, {
  level: 'info',
  message: 'Custom log entry'
}, ['custom', 'api']);

// Get entries
const entries = telescope.getEntries();

// Clear entries
telescope.clearEntries();
```

#### TelescopeConfig
```typescript
interface TelescopeConfig {
  enabled: boolean;
  path: string;
  max_entries: number;
  ignored_paths: string[];
  watchers: {
    requests: boolean;
    exceptions: boolean;
    logs: boolean;
    queries: boolean;
  };
}
```

### Entry Types

```typescript
enum EntryType {
  REQUEST = 'request',
  EXCEPTION = 'exception',
  LOG = 'log',
  QUERY = 'query'
}
```

## Advanced Usage

### Custom Storage

Implement your own storage backend:

```typescript
import { TelescopeStorage, TelescopeEntry } from 'hono-telescope';

class RedisStorage implements TelescopeStorage {
  async store(entry: TelescopeEntry): Promise<void> {
    // Store in Redis
  }

  async retrieve(type?: string, limit?: number): Promise<TelescopeEntry[]> {
    // Retrieve from Redis
  }

  // ... implement other methods
}
```

### Custom Middleware

Create custom monitoring middleware:

```typescript
import { Telescope, EntryType } from 'hono-telescope';

const customMiddleware = async (c, next) => {
  const start = Date.now();
  
  await next();
  
  const telescope = Telescope.getInstance();
  telescope.record(EntryType.REQUEST, {
    // Custom data
  }, ['custom']);
};
```

## Examples

Check the `/example` directory for a complete example application demonstrating all features.

```bash
cd example
bun install
bun run dev
```

Visit `http://localhost:3000/telescope` to see the dashboard in action.

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/hono-telescope.git
cd hono-telescope

# Install dependencies
bun install

# Build the project
bun run build

# Run the example
bun run example
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Laravel Telescope](https://laravel.com/docs/telescope)
- Built for [Hono.js](https://hono.dev/) framework
- Uses modern TypeScript and ES modules

---

Made with ❤️ for the Hono.js community