# hono-telescope

[![npm version](https://badge.fury.io/js/hono-telescope.svg)](https://badge.fury.io/js/hono-telescope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Ready-black.svg)](https://bun.sh/)
[![Node.js](https://img.shields.io/badge/Node.js->=18.0.0-green.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/jubstaaa/hono-telescope?style=social)](https://github.com/jubstaaa/hono-telescope)
[![GitHub watchers](https://img.shields.io/github/watchers/jubstaaa/hono-telescope?style=social)](https://github.com/jubstaaa/hono-telescope)

> **⚠️ Beta Release**: This package is currently in beta. APIs may change before the stable release.

A powerful debugging and monitoring tool for Hono applications, inspired by Laravel Telescope. Monitor HTTP requests, exceptions, logs, and database queries with a beautiful web dashboard.

---

## 🌐 Live Demo

> 🎉 **Try it live!** No installation needed. Test all features on our hosted example:
>
> **[📊 Hono Telescope Dashboard](https://hono-telescope-9lvpv.ondigitalocean.app/telescope)**
>
> **API Base URL:** `https://hono-telescope-9lvpv.ondigitalocean.app`

---

## ✨ Features

**Currently Available:**

- 🔍 **HTTP Request Monitoring** - Track all incoming and outgoing requests with detailed headers and payloads
- 🚨 **Exception Tracking** - Capture and monitor application errors with stack traces
- 📝 **Log Monitoring** - Monitor console logs with different severity levels
- 🗄️ **Database Query Monitoring** - Track SQL queries (Prisma, Sequelize, MongoDB, Bun SQLite) with execution time
- 📊 **Beautiful Dashboard** - Modern React-based web interface with real-time updates
- 🎯 **Zero Configuration** - Works out of the box with sensible defaults
- 🏷️ **Tagging System** - Organize entries with custom tags and context
- 🔧 **TypeScript Support** - Full type definitions and type safety
- ⚡ **High Performance** - Minimal overhead with efficient memory management
- 🌐 **Bun & Node.js** - Works with both runtimes seamlessly
- 🗂️ **Multiple Database Support** - Integrates with popular database libraries

**Planned Features (Roadmap):**

- 🎨 **Code Formatting** - Built-in Prettier integration for consistent code style
- 🔖 **Automated Versioning** - Release-it integration for semantic versioning
- 💾 **Data Export** - Export monitored data in multiple formats (JSON, CSV)
- 🔔 **Alerts & Notifications** - Real-time alerts for errors and performance issues
- 📈 **Analytics & Reporting** - Advanced analytics and historical data analysis
- 🔐 **Authentication & Authorization** - Dashboard access control
- 🌍 **Multi-Tenancy Support** - Support for multiple isolated projects
- 📱 **Mobile Dashboard** - Responsive mobile-friendly dashboard improvements
- 🧩 **Plugin System** - Extensible plugin architecture for custom integrations
- 🔄 **Data Persistence** - Optional database storage for long-term monitoring

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
import { setupTelescope } from 'hono-telescope';

const app = new Hono();

// Setup Telescope with default configuration
setupTelescope(app);

// Your routes
app.get('/', (c) => {
  console.log('Home page accessed');
  return c.json({ message: 'Hello World!' });
});

export default app;
```

Visit `http://localhost:3000/telescope` to access the dashboard.

> 📋 **Complete Example**: See [src/example/index.ts](./src/example/index.ts) for a full working example with all Telescope features including database query monitoring, multiple HTTP clients (fetch + Axios), and error handling.

## API Testing

### Try the Live Demo

Visit the [live dashboard](https://hono-telescope-9lvpv.ondigitalocean.app/telescope) and test these endpoints:

**API Base:** `https://hono-telescope-9lvpv.ondigitalocean.app`

#### Quick Test with Shell Script

Run all endpoints at once with our test script:

```bash
# Download and run the test script
bash <(curl -s https://raw.githubusercontent.com/jubstaaa/hono-telescope/main/src/example/test-all-endpoints.sh)
```

Or if you have the repo cloned locally:

```bash
bash src/example/test-all-endpoints.sh
```

This will automatically test all endpoints and populate the Telescope dashboard with data! ✨

#### Available Test Endpoints

**Users Management**

```bash
# Get all users
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/users

# Create a new user
curl -X POST https://hono-telescope-9lvpv.ondigitalocean.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "username": "johndoe"}'

# Get user by ID
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/users/1

# Update user
curl -X PUT https://hono-telescope-9lvpv.ondigitalocean.app/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "username": "janedoe"}'

# Delete user
curl -X DELETE https://hono-telescope-9lvpv.ondigitalocean.app/api/users/1
```

**Database Operations** (SQLite with Bun)

```bash
# Trigger database query
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/health/db
```

**External Requests** (HTTP Interceptor)

```bash
# Trigger outgoing HTTP request (tested with Axios)
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/external/request
```

**Error Handling** (Exception Tracking)

```bash
# Trigger an error
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/error
```

**Logging** (Log Monitoring)

```bash
# Trigger log entries
curl https://hono-telescope-9lvpv.ondigitalocean.app/api/logs
```

### View the Dashboard

After making requests, visit the [Telescope Dashboard](https://hono-telescope-9lvpv.ondigitalocean.app/telescope) to see:

- 📊 **Incoming Requests** - All HTTP requests with headers, payload, and response
- 📤 **Outgoing Requests** - External API calls made by the app
- 📝 **Logs** - Console logs captured in real-time
- ⚠️ **Exceptions** - Errors and stack traces
- 🗄️ **Queries** - Database queries with execution time
- 📈 **Statistics** - Summary of all monitored events

## Configuration

```typescript
import { setupTelescope } from 'hono-telescope';

setupTelescope(app, {
  enabled: true, // Enable/disable Telescope
  path: '/telescope', // Dashboard path
  max_entries: 1000, // Maximum entries to store
  ignored_paths: ['/health'], // Paths to ignore
  watchers: {
    requests: true, // Monitor HTTP requests
    exceptions: true, // Monitor exceptions
    logs: true, // Monitor logs
    queries: true, // Monitor database queries
  },
});
```

## Database Query Monitoring

Hono Telescope automatically intercepts and monitors queries from:

- **Prisma** - Full ORM support with $queryRaw and $executeRaw
- **Sequelize** - SQL ORM query tracking
- **MongoDB** - NoSQL document operations
- **Bun SQLite** - Native SQLite database queries

Queries are automatically captured with:

- ⏱️ Execution time
- 📋 Query text and bindings
- 🔗 Parent request context
- 🚨 Error information if query fails

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

Hono Telescope requires three separate processes running simultaneously for full development experience. Open three terminal windows:

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
