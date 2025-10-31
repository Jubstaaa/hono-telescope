# Contributing to Hono Telescope

First off, thanks for taking the time to contribute! 🎉

Hono Telescope is a community-driven project, and we love contributions from everyone - whether it's bug reports, feature requests, documentation, or code.

## Code of Conduct

Be respectful, inclusive, and professional. We're building something great together!

## How Can I Contribute?

### 🐛 Reporting Bugs

Found a bug? Great! Please report it by [opening an issue](https://github.com/jubstaaa/hono-telescope/issues/new?template=bug_report.md).

**Before you report:**

- Check if the bug already exists in [issues](https://github.com/jubstaaa/hono-telescope/issues)
- Try to reproduce it with the latest version
- Include as much detail as possible (steps to reproduce, error messages, environment)

**What to include:**

- OS and Node.js/Bun version
- Error message and stack trace
- Minimal code example to reproduce
- Expected vs actual behavior

### ✨ Suggesting Enhancements

Have an idea? Let's discuss it!

- [Open a discussion](https://github.com/jubstaaa/hono-telescope/discussions) for feature ideas
- Describe the use case and why it would be useful
- Provide examples if possible

### 📝 Improving Documentation

Documentation improvements are always welcome!

- Fix typos or unclear explanations
- Add examples or clarifications
- Improve README or add guides
- Submit a pull request with your improvements

### 🧑‍💻 Contributing Code

#### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/hono-telescope.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `bun install`

#### Development Setup

```bash
# Install dependencies
bun install

# Run TypeScript in watch mode
bun run dev

# Run the example app
bun run dev:example

# Run the dashboard in dev mode
bun run dev:dashboard

# Build the project
bun run build

# Run tests
bun run test

# Lint code
bun run lint

# Fix lint issues
bun run lint:fix

# Format code
bun run format
```

#### Development Workflow

1. **Create a branch** with a descriptive name:

   ```bash
   git checkout -b feature/add-http-caching
   # or
   git checkout -b fix/dashboard-loading-bug
   ```

2. **Make your changes** following the code style:
   - Use TypeScript for new code
   - Follow ESLint rules (run `bun run lint:fix`)
   - Format with Prettier (run `bun run format`)
   - Write meaningful comments for complex logic

3. **Test your changes**:

   ```bash
   bun run build
   bun run test
   ```

4. **Commit with conventional commits**:

   ```bash
   git commit -m "feat(dashboard): add dark mode toggle"
   # or
   git commit -m "fix(interceptor): prevent double-logging of requests"
   ```

   Format: `type(scope): description`
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation
   - `style`: Formatting (no logic change)
   - `refactor`: Code restructuring
   - `perf`: Performance improvement
   - `test`: Tests
   - `build`: Build system

5. **Push and create a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

   - Describe what your PR does
   - Reference any related issues
   - Include before/after screenshots for UI changes

#### Code Style Guidelines

- **TypeScript**: Strict mode, explicit types
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Comments**: Use for "why", not "what" the code does
- **Functions**: Keep them small and focused
- **Error Handling**: Always handle errors gracefully

#### Project Structure

```
src/
├── core/                 # Core Telescope functionality
│   ├── dashboard/        # Dashboard files
│   ├── interceptors/     # Request/DB interceptors
│   ├── middleware/       # Hono middleware
│   ├── routes/          # API routes
│   ├── storage/         # Data storage
│   ├── utils/           # Utilities
│   └── watchers/        # Event watchers
├── dashboard/           # React dashboard UI
│   ├── components/      # React components
│   ├── views/          # Page components
│   └── store/          # Redux store
├── types/              # TypeScript types
└── example/            # Example application
```

#### Key Concepts

- **Interceptors**: Catch and record HTTP requests/responses and database queries
- **Watchers**: Monitor exceptions, logs, and other events
- **Storage**: In-memory storage of recorded data (MemoryStorage)
- **Dashboard**: React UI for visualizing data
- **Context Manager**: Manage request context for correlation

### 🧪 Testing

Currently using Vitest. Add tests for new features:

```bash
bun run test
```

### 📚 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include examples for new features
- Update CHANGELOG.md with your changes

## Pull Request Process

1. Update the CHANGELOG.md with your changes
2. Update README.md if needed
3. Ensure all tests pass: `bun run test`
4. Ensure code is formatted: `bun run format`
5. Ensure linting passes: `bun run lint`
6. Request review from maintainers
7. Address any feedback
8. Merge once approved!

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

Optional longer explanation here.

Fixes #123
```

**Examples:**

- `feat(dashboard): add request filtering by status code`
- `fix(middleware): prevent context memory leak`
- `docs(readme): improve installation instructions`
- `refactor(interceptor): simplify header sanitization`

## Project Roadmap

Check out [GitHub Issues](https://github.com/jubstaaa/hono-telescope/issues) for planned features and known issues.

**Upcoming features:**

- 💾 Data export (JSON, CSV)
- 🔔 Real-time alerts
- 📈 Advanced analytics
- 🔐 Dashboard authentication
- 🌍 Multi-tenancy support

## Questions?

- 💬 Open a [GitHub Discussion](https://github.com/jubstaaa/hono-telescope/discussions)
- 🐛 Found an issue? [Report it](https://github.com/jubstaaa/hono-telescope/issues)
- 📧 Email: ilkerbalcilartr@gmail.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:

- Listed in CHANGELOG.md
- Mentioned in GitHub releases
- Recognized as community heroes! 🦸

---

**Happy Contributing! 🚀**
