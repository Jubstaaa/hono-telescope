# Hono Telescope Monorepo

This project is structured as a Turborepo monorepo for better package management and development workflow. Below is the folder structure and description of each package.

## Folder Structure

```
hono-telescope/
├── apps/
│   ├── core/              # @hono-telescope/core - Core monitoring and debugging library
│   ├── example/           # @hono-telescope/example - Example Hono application
│   └── dashboard/         # @hono-telescope/dashboard - React-based web dashboard
├── packages/
│   └── types/             # @hono-telescope/types - Shared TypeScript type definitions
├── package.json           # Root workspace package.json
├── turbo.json             # Turborepo configuration
├── .release-it.json       # Release automation configuration
├── .prettierrc             # Code formatting configuration
├── eslint.config.js       # ESLint configuration
└── tsconfig.json          # Root TypeScript configuration
```

## Packages

### `@hono-telescope/types` (packages/types)

Shared type definitions used across all packages.

- **Interfaces**: `TelescopeEntry`, `TelescopeConfig`, `IncomingRequestEntry`, `OutgoingRequestEntry`, `ExceptionEntry`, `LogEntry`, `QueryEntry`
- **Types**: Union types for entry handling
- **Enums**: `LogLevel`, `ExceptionClass`

### `@hono-telescope/core` (apps/core)

The main Hono Telescope library providing monitoring, debugging, and data storage functionality.

**Key Components:**

- **Interceptors**: HTTP and Database query interception
  - `HttpInterceptor` - Captures incoming/outgoing HTTP requests
  - `DatabaseInterceptor` - Monitors SQL queries (Prisma, Sequelize, MongoDB, Bun SQLite)
- **Middleware**: `TelescopeMiddleware` - Hono middleware for request tracking
- **Watchers**: Background monitoring
  - `ExceptionWatcher` - Tracks uncaught exceptions
  - `LogWatcher` - Monitors console output
  - `QueryWatcher` - Tracks database queries
- **Routes**: `TelescopeRoutes` - API endpoints for dashboard
- **Storage**: `MemoryStorage` - In-memory data persistence
- **Context Manager**: Request context tracking

### `@hono-telescope/example` (apps/example)

Example Hono application demonstrating all Telescope features:

- HTTP request monitoring
- Exception tracking
- Log monitoring
- Database query interception
- Multiple database support
- Mixed HTTP client testing (fetch + Axios)

### `@hono-telescope/dashboard` (apps/dashboard)

React-based web dashboard for visualizing monitored data.

**Tech Stack:**

- Built with Vite + React 18
- Ant Design UI components
- Redux for state management
- Modern CSS with responsive design
- Real-time data updates

## Available Commands

### Root Level

```bash
# Install dependencies
bun install

# Development (all packages)
bun run dev                    # Start all apps in dev mode
bun run dev:example           # Run example app only
bun run dev:dashboard         # Run dashboard only

# Building
bun run build                 # Build all packages
bun run build                 # Generates dist/ at root level

# Code Quality
bun run lint                  # Run ESLint
bun run lint:fix              # Fix linting issues
bun run format                # Format with Prettier
bun run format:check          # Check formatting without changes
bun run type-check            # TypeScript type checking

# Release & Publishing
bun run release               # Create release (interactive)
                              # - Bumps version
                              # - Generates changelog
                              # - Creates git tag
                              # - Publishes to npm

# Maintenance
bun run clean                 # Clean all build artifacts and node_modules
bun run prepublishOnly        # Auto-runs before npm publish
```

### Workspace Level

Each package has its own scripts in `package.json`:

```bash
# Core package
cd apps/core
bun run build                # TypeScript compilation
bun run dev                  # Watch mode development

# Dashboard package
cd apps/dashboard
bun run dev                  # Vite dev server
bun run build                # Production build
bun run preview              # Preview production build

# Example package
cd apps/example
bun run dev                  # Watch mode
bun run start                # Run compiled server
```

## Dependency Management

- **Shared dependencies**: Defined in root `package.json`
- **Package-specific dependencies**: Defined in each package's `package.json`
- **Internal dependencies**: Cross-package dependencies use workspace protocol (e.g., `"@hono-telescope/types": "workspace:*"`)
- **Shared tools**: ESLint, Prettier, TypeScript, release-it configured at root level

## Quick Start

### 1. Installation

```bash
cd hono-telescope
bun install
```

### 2. Development

```bash
# Start all packages in dev mode
bun run dev

# Or run specific package
bun run dev:example
```

Visit `http://localhost:3000` for the example app and `http://localhost:3000/telescope` for the dashboard.

### 3. Building

```bash
# Build all packages
bun run build

# Verify builds
ls -la apps/core/dist
ls -la apps/dashboard/dist
```

### 4. Code Quality

```bash
# Check and fix linting issues
bun run lint:fix

# Format code
bun run format

# Type check entire project
bun run type-check
```

## Turborepo Pipeline

The `turbo.json` file defines the build pipeline:

- **build**: Runs after dependencies are built
- **dev**: No caching, persistent mode
- **test**: No caching for test runs
- **type-check**: No caching
- **lint**: Incremental linting
- **format**: Code formatting tasks

## Release Process

This project uses **release-it** for automated versioning and publishing:

```bash
# Create a new release
bun run release

# The release process:
# 1. Validates clean working directory
# 2. Requires main branch
# 3. Runs: lint:fix, build, format
# 4. Bumps version (Semantic Versioning)
# 5. Generates CHANGELOG.md
# 6. Creates git tag (v{version})
# 7. Pushes to GitHub
# 8. Creates GitHub Release
# 9. Publishes to npm

# Conventional Commits for automatic versioning:
# - feat: -> minor version bump (new feature)
# - fix: -> patch version bump (bug fix)
# - BREAKING CHANGE: -> major version bump
# - chore:, style:, refactor:, etc. -> no version bump
```

## Code Quality Tools

### ESLint

TypeScript-aware linting with strict rules:

- `@typescript-eslint` for TS-specific rules
- `prettier` integration for formatting consistency
- Located in `eslint.config.js`

### Prettier

Code formatting with opinionated defaults:

- Configuration in `.prettierrc`
- Ignore patterns in `.prettierignore`
- Integrated with ESLint for consistency

### TypeScript

Strict TypeScript configuration across all packages:

- ES2020+ target
- Strict mode enabled
- Module resolution with workspace support

## Publishing

Packages are published to npm via the `release-it` command:

```bash
# Automated publishing (recommended)
bun run release

# Manual publishing (if needed)
cd apps/core
npm publish

cd apps/dashboard
npm publish
```

## Testing & Type Checking

```bash
# Full project type check
bun run type-check

# Run linter with fix
bun run lint:fix

# Format code
bun run format

# Check formatting without changes
bun run format:check
```

## Technology Stack

- **Runtime**: Bun 1.0+ and Node.js 18+
- **Language**: TypeScript 5.0+
- **Module System**: ES Modules (ESNext)
- **Package Manager**: Bun
- **Build Tool**: Turbo
- **Dashboard**: React 18 + Vite
- **UI Components**: Ant Design
- **State Management**: Redux
- **Code Quality**: ESLint + Prettier

## Notes

- All packages are written with TypeScript 5.0+
- Supports both Node.js 18+ and Bun 1.0+
- Uses ES modules throughout
- Strict TypeScript mode is enabled
- All code follows Conventional Commits specification
- Automated testing and type checking on commits recommended

## Troubleshooting

### "Command not found" errors

- Run `bun install` from the root directory
- Ensure you're using Bun 1.0+ or npm/yarn

### Build issues

- Clean everything: `bun run clean`
- Reinstall: `bun install`
- Rebuild: `bun run build`

### Type checking failures

- Run `bun run type-check` for detailed errors
- Update TypeScript: `bun install --latest`

## Contributing

1. Create a feature branch from `main`
2. Follow Conventional Commits for your commits
3. Run `bun run format` and `bun run lint:fix` before committing
4. Open a Pull Request
5. Ensure all CI checks pass
