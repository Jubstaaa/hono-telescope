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

> 📚 **Monorepo Structure**: This project uses Turborepo! For detailed workspace information, see [MONOREPO.md](./MONOREPO.md).

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

### Scripts

```bash
# Install dependencies
bun install

# Development
bun run dev                    # Start all apps in dev mode
bun run dev:example          # Run example app only
bun run dev:dashboard        # Run dashboard only

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
├── apps/
│   ├── core/              # Main Telescope library
│   ├── dashboard/         # React-based web dashboard
│   └── example/           # Example Hono application
├── packages/
│   └── types/             # Shared TypeScript types
├── .release-it.json       # Release automation config
├── .prettierrc             # Code formatting config
└── eslint.config.js       # Linting configuration
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

3. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

### Development Workflow

1. Make your changes following our code style (ESLint + Prettier)
2. Write clear, descriptive commit messages using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

3. Run tests and checks:

   ```bash
   bun run lint:fix      # Fix linting issues
   bun run format        # Format code
   bun run type-check    # Type checking
   bun run build         # Build project
   ```

4. **Commit and Push**:

   ```bash
   git commit -m "feat(core): add amazing feature"
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request** on GitHub with:
   - Clear description of changes
   - Related issue numbers (if any)
   - Screenshots/videos for UI changes

### Pull Request Guidelines

- ✅ All CI checks must pass
- ✅ Code must follow ESLint rules
- ✅ Add tests for new features
- ✅ Update documentation if needed
- ✅ Rebase on latest `main` branch

### Code Style

- Follow TypeScript best practices
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Areas for Contribution

- 🐛 **Bug Fixes** - Fix existing issues
- ✨ **Features** - Implement features from the roadmap
- 📚 **Documentation** - Improve docs and examples
- 🧪 **Tests** - Add test coverage
- 🎨 **UI/UX** - Improve dashboard design
- 🚀 **Performance** - Optimize performance

### Questions?

- 📖 Check [existing issues](https://github.com/jubstaaa/hono-telescope/issues)
- 💬 Start a [discussion](https://github.com/jubstaaa/hono-telescope/discussions)
- 📧 Reach out to maintainers

## License

MIT © 2024 - Hono Telescope Contributors

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed release history and version information.

## Support

- 📖 [Documentation](https://github.com/jubstaaa/hono-telescope)
- 🐛 [Issue Tracker](https://github.com/jubstaaa/hono-telescope/issues)
- 💬 [Discussions](https://github.com/jubstaaa/hono-telescope/discussions)

---

**Made with ❤️ by the Hono Community**
