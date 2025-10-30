# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1-beta.2] - 2025-01-28

### ✨ Added

- **Zero-Config Axios Support** - Improved automatic detection of Axios instances without requiring global configuration
- **Custom Axios Instance Test** - Added example demonstrating zero-config usage with custom Axios instances

### 🔧 Technical Improvements

- Enhanced HTTP interceptor to better detect Axios through multiple methods (globalThis, require, dynamic import)
- Improved documentation for zero-config Axios setup
- Added test example for custom Axios instances

### 📚 Documentation

- Updated README with zero-config approach examples
- Added guidance for custom Axios instance usage

## [0.1.0-beta.2] - 2025-10-28

### ✨ Added

- **Axios Interceptor Support** - Automatic interception of outgoing HTTP requests made with Axios
- **Enhanced HTTP Monitoring** - Now captures both incoming requests (via Hono middleware) and outgoing requests (via Axios interceptor)

### 📚 Documentation

- Added comprehensive Axios setup instructions to README.md
- Documented requirement for making Axios globally accessible via `globalThis.axios`

### 🔧 Technical Improvements

- Enhanced HTTP interceptor to detect and hook into Axios instances
- Added debug logging for Axios interceptor setup
- Improved error handling in HTTP interceptor

## [0.1.0-beta.1] - 2024-12-27

### 🎉 Initial Beta Release

This is the first beta release of `hono-telescope`, a powerful debugging and monitoring tool for Hono applications inspired by Laravel Telescope.

### ✨ Added

#### Core Features

- **HTTP Request Monitoring** - Complete request/response tracking with headers, body, and performance metrics
- **Exception Tracking** - Automatic capture of uncaught exceptions and unhandled rejections
- **Log Monitoring** - Console log interception with support for all log levels (log, warn, error, info)
- **Database Query Monitoring** - SQL query tracking with execution time and parameter binding

#### Dashboard & UI

- **Modern React Dashboard** - Beautiful, responsive web interface built with React and Ant Design
- **Real-time Data Display** - Live monitoring of application activity
- **Filtering & Search** - Advanced filtering capabilities for all entry types
- **Performance Metrics** - Response time, and other performance indicators
- **Tagging System** - Organize and categorize entries with custom tags

#### Developer Experience

- **Zero Configuration Setup** - Works out of the box with `setupTelescope(app)`
- **TypeScript Support** - Full type definitions for better development experience
- **Flexible Configuration** - Customizable options for path, storage limits, and watchers
- **Multiple Runtime Support** - Compatible with both Node.js and Bun

#### API & Integration

- **Manual Query Recording** - `recordQuery()` function for custom database query tracking
- **Custom Tagging** - `addTag()` function for adding context to entries
- **Watcher System** - Modular watchers for different types of monitoring
- **Configurable Storage** - In-memory storage with customizable entry limits

### 🔧 Technical Details

#### Dependencies

- **Hono**: >= 3.0.0 (peer dependency)
- **React**: ^18.2.0 (for dashboard)
- **Ant Design**: ^5.12.8 (UI components)
- **TypeScript**: Full type support included

#### Runtime Requirements

- **Node.js**: >= 18.0.0
- **Bun**: >= 1.0.0 (optional)

#### Configuration Options

```typescript
interface TelescopeConfig {
  path?: string; // Dashboard path (default: '/telescope')
  maxEntries?: number; // Maximum entries to store (default: 1000)
  tags?: string[]; // Default tags for all entries
  watchers?: {
    requests?: boolean; // Monitor HTTP requests (default: true)
    exceptions?: boolean; // Monitor exceptions (default: true)
    logs?: boolean; // Monitor logs (default: true)
    queries?: boolean; // Monitor database queries (default: true)
  };
}
```

### 📦 Package Information

- **Package Name**: `hono-telescope`
- **Version**: `0.1.0-beta.1`
- **License**: MIT
- **Author**: İlker Balcılar
- **Repository**: https://github.com/ilkerbalcilar/hono-telescope

### ⚠️ Beta Release Notes

This is a beta release, which means:

- APIs may change before the stable 1.0.0 release
- Some features are still being refined
- Community feedback is highly appreciated
- Production use should be carefully evaluated

### 🚀 Getting Started

```bash
npm install hono-telescope
```

```typescript
import { Hono } from 'hono';
import { setupTelescope } from 'hono-telescope';

const app = new Hono();
setupTelescope(app);

export default app;
```

Visit `/telescope` to access the monitoring dashboard.

### 🗺️ What's Next?

See our [roadmap in the README](README.md#-roadmap) for upcoming features including:

- Real-time WebSocket updates
- Performance profiling
- Authentication system
- Database persistence options
- Multi-application support

### 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](README.md#-contributing) for details.

---

**Full Changelog**: https://github.com/ilkerbalcilar/hono-telescope/commits/v0.1.0-beta.1
