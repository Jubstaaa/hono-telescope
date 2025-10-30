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

## ✨ Features

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
- 🎨 **Code Formatting** - Built-in Prettier integration for consistent code style
- 🔖 **Automated Versioning** - Release-it integration for semantic versioning

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
- Telescope Dashboard: `http://localhost:3000/telescope`

**Terminal 3 - Dashboard Dev Server (Optional)**

```bash
bun run dev:dashboard
```

This runs the dashboard on `http://localhost:3001` with Vite dev server for faster React development.

- Use this if you're making changes to the dashboard UI

### Example Development Workflow

```bash
# Terminal 1
cd hono-telescope-3
bun install
bun run build
bun run dev

# Terminal 2 (in a new terminal window)
cd hono-telescope-3
bun run dev:example

# Terminal 3 (optional, in another new terminal window)
cd hono-telescope-3
bun run dev:dashboard
```

Now you can:

- Edit source files in `src/core/` and see changes reflected
- Edit `src/example/` and the app will hot reload
- Edit dashboard components in `src/dashboard/` (if using Terminal 3)
- Access the dashboard at `http://localhost:3000/telescope` or `http://localhost:3001` (if using Terminal 3)

## Building

### Scripts

```bash
# Install dependencies
bun install

# Development
bun run dev                    # TypeScript watch mode
bun run dev:example          # Run example app with hot reload
bun run dev:dashboard        # Run dashboard dev server

# Building
bun run build                # Build all packages
bun run type-check           # Type checking with TypeScript

# Code Quality
bun run lint                 # Run ESLint
bun run lint:fix             # Fix ESLint issues
bun run format               # Format with Prettier
bun run format:check         # Check Prettier formatting

# Release
bun run release              # Create a new release with automated versioning
```

### Release Process

This project uses **release-it** for automated versioning and releases:

```bash
# Create a new release (interactive)
bun run release

# This will:
# 1. Run linting and formatting
# 2. Build the project
# 3. Bump version (follows Semantic Versioning)
# 4. Generate changelog from Conventional Commits
# 5. Create git tag
# 6. Push to GitHub
# 7. Create GitHub Release
# 8. Publish to npm
```

**Conventional Commits** are used for automatic version bumping:

- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `BREAKING CHANGE:` - Major version bump
- `chore:`, `style:`, `refactor:`, etc. - No version bump

### Project Structure

```
hono-telescope/
├── src/
│   ├── core/              # Core Telescope library
│   ├── dashboard/         # React-based web dashboard
│   ├── example/           # Example Hono application
│   ├── types/             # TypeScript type definitions
│   └── index.ts           # Main entry point
├── .release-it.json       # Release automation config
├── .prettierrc             # Code formatting config
├── eslint.config.js       # Linting configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
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

Monitors console logs with different severity levels:

```typescript
import { startLogWatcher, stopLogWatcher } from 'hono-telescope';

// Start monitoring logs
startLogWatcher();

console.log('Info message');
console.error('Error message');
console.warn('Warning message');

// Stop monitoring (if needed)
stopLogWatcher();
```

## API Reference

### setupTelescope(app, config?)

Initialize Telescope middleware on your Hono application.

**Parameters:**

- `app` - Hono application instance
- `config` - Optional configuration object

**Returns:** void

### startExceptionWatcher()

Start monitoring uncaught exceptions and errors.

### startLogWatcher()

Start monitoring console output.

### DatabaseInterceptor

Automatically intercepts database queries from supported ORM/libraries.

## Browser Support

The Telescope dashboard works on all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🚀 Upcoming Features

We're actively working on exciting new features:

- 📱 **Mobile Dashboard** - Responsive mobile interface for on-the-go monitoring
- 🔔 **Real-time Alerts** - Get notified about errors and performance issues
- 📊 **Advanced Analytics** - Detailed performance metrics and trends
- 🔐 **Authentication** - User authentication and role-based access control
- 🎯 **Request Filtering** - Advanced filtering and search capabilities
- 🏷️ **Custom Tags** - User-defined tags and categories for better organization
- 📤 **Export Data** - Export monitored data to various formats (CSV, JSON, PDF)
- 🔌 **Webhook Integration** - Send alerts to external services
- 🗄️ **Multiple Storage Backends** - Support for Redis, PostgreSQL, MongoDB storage
- 🌙 **Dark Mode** - Full dark theme support
- ⚙️ **Custom Plugins** - Plugin system for extending functionality
- 📈 **Performance Profiling** - Detailed performance analysis and bottleneck detection

## Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository** on [GitHub](https://github.com/jubstaaa/hono-telescope)
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/hono-telescope.git
   cd hono-telescope
   bun install
   ```
