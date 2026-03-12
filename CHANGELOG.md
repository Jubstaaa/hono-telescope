

## 0.1.18 (2026-03-12)


### ✨ Features

* Add Axios interceptor support and release v0.1.0-beta.2 ([06378d2](https://github.com/jubstaaa/hono-telescope/commit/06378d245a9c9c378d3ab085c65e930c402cb53e))
* **build:** optimize dashboard bundle size\n\n- Add granular manualChunks (ui-antd, react-core, router, state, utils, http, ui-utils, app)\n- Enable terser minification with drop_console/drop_debugger and mangle\n- Report compressed sizes; tighten chunk size warning threshold\n- Prebundle critical deps via optimizeDeps.include\n- Add terser and babel-plugin-import to devDependencies\n\nImpact: raw ~1.2MB total, gzip ~385KB; removed duplicated multi-MB bundles. ([ef36e48](https://github.com/jubstaaa/hono-telescope/commit/ef36e4858e66a0da77978120426782182d7e9bfe))
* **deployment:** add docker support and digital ocean deployment guide ([47d7eaa](https://github.com/jubstaaa/hono-telescope/commit/47d7eaa91073a8afb9c2c9b31b2717045f3e5fee))
* **exception:** sanitize sensitive headers in exception context ([d7610ee](https://github.com/jubstaaa/hono-telescope/commit/d7610eeb12dbd8d46308fdda4736594ad4597854))
* initial release of @hono/telescope v0.1.0-beta.1 ([c4d6376](https://github.com/jubstaaa/hono-telescope/commit/c4d6376f22331bff43e2e6d2da23c70b0bceae98))
* major UI/UX improvements and filtering enhancements ([1d9276c](https://github.com/jubstaaa/hono-telescope/commit/1d9276c861431aa6323c8f6bccca8c380321e5c4))
* **project:** restructure to monorepo and improve hono compatibility ([c6e814c](https://github.com/jubstaaa/hono-telescope/commit/c6e814cb223b8ac7172924e5f996cee116605ae3))
* **telescope:** add clear data and live mode features ([3e9b3e2](https://github.com/jubstaaa/hono-telescope/commit/3e9b3e27ab4fe2d5f4cfd1ab6ee8c276d2bbdd43))


### 🐛 Bug Fixes

* add npm OTP support to release config ([1c710b1](https://github.com/jubstaaa/hono-telescope/commit/1c710b13ef90e2c8b6576bc7b9ab5f563f2e9f4d))
* address cursor bot review feedback ([5bec183](https://github.com/jubstaaa/hono-telescope/commit/5bec183136ec4192f0e185201485638ce2dcdb25))
* **core:** resolve all linter errors and improve database interceptor ([3262bb6](https://github.com/jubstaaa/hono-telescope/commit/3262bb603406cb0ee12cc0d0781122aebdd24c8b))
* correct sed command in build script ([7711b10](https://github.com/jubstaaa/hono-telescope/commit/7711b10f7b9ab1f5e7bdcca3cacf9d912707536b))
* **dashboard:** import SVG icon as module and separate roadmap features ([9c6b9e9](https://github.com/jubstaaa/hono-telescope/commit/9c6b9e92b83d46f5c073ae2d3023068da3e52271))
* **docker:** install dev dependencies for build, then clean up ([17e730a](https://github.com/jubstaaa/hono-telescope/commit/17e730afa677ab8fbb74e5f38afe4885b03d8b02))
* remove broken otp config from release-it ([832ad65](https://github.com/jubstaaa/hono-telescope/commit/832ad6569faef1db34366d1742f56ee3460aae63))
* replace @hono-telescope/types imports in dist files ([d6524cd](https://github.com/jubstaaa/hono-telescope/commit/d6524cd48ef94f6bf81cdd76898c84231fef1d63))
* resolve @hono-telescope/types import errors ([ae798d6](https://github.com/jubstaaa/hono-telescope/commit/ae798d6ec2201a2b54d18a1249ee7ca70bfcc5c3)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)
* resolve eslint errors, add lint and test to CI and release pipeline ([9c201a2](https://github.com/jubstaaa/hono-telescope/commit/9c201a2e9815be79518f07e6585924123b1a9e10))
* **security:** finalize header sanitization implementation ([f9c5af6](https://github.com/jubstaaa/hono-telescope/commit/f9c5af6604a72c1c66fc9747f55c4157e82e80a8))
* **types:** resolve @hono-telescope/types module import errors ([a94416b](https://github.com/jubstaaa/hono-telescope/commit/a94416bf2ed3e5fba02366732e9fb13ba8394749)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)
* use node script instead of sed for import replacement ([91a8a2e](https://github.com/jubstaaa/hono-telescope/commit/91a8a2e42d892516944970f30c96c49829d24195))


### ♻️ Refactoring

* comprehensive bug fixes, cleanup, and dependency optimization ([014dd01](https://github.com/jubstaaa/hono-telescope/commit/014dd0188ae2692a1718011f31d4e65ff5ea2626))
* convert to turborepo monorepo structure ([ec4a443](https://github.com/jubstaaa/hono-telescope/commit/ec4a4436286bee36c4af13e714afb3a3910722dd))
* **core,dashboard:** complete type system overhaul and API restructuring ([5fa775d](https://github.com/jubstaaa/hono-telescope/commit/5fa775d89a95f74ba78eb803ae3180a3c2497199))
* restructure project with clean architecture and improved organization ([536b21c](https://github.com/jubstaaa/hono-telescope/commit/536b21cee4ad5a8974be141dff2648ea481ca563))


### 💎 Styling

* **core:** format database interceptor with prettier ([0e51d4c](https://github.com/jubstaaa/hono-telescope/commit/0e51d4ca7a3723fef445d9c9ed4eb45e2b2f70d4))
* ignore CHANGELOG.md from prettier formatting ([7193226](https://github.com/jubstaaa/hono-telescope/commit/71932265235a8467fd7416fb6b1cf061ce4cf845))


### 📚 Documentation

* add professional open source governance files ([c3b0696](https://github.com/jubstaaa/hono-telescope/commit/c3b0696987e733fd7f2fd6c43cc5ad7f1bdc38fa))
* **community:** add contributing guide and issue templates ([83b9913](https://github.com/jubstaaa/hono-telescope/commit/83b9913f996d763875ae4539c96b1ab334d4cc69))
* formatting improvements in MONOREPO.md ([3b1c282](https://github.com/jubstaaa/hono-telescope/commit/3b1c2821d6697dfb1c4465385a0b2875bf878242))
* **release:** add comprehensive release notes for v0.1.11 ([0b4819a](https://github.com/jubstaaa/hono-telescope/commit/0b4819a14deeba9e790a1ce9191d0506aa290977))
* update documentation for single workspace structure ([936b8d0](https://github.com/jubstaaa/hono-telescope/commit/936b8d0ae0e857a0b67694265e5edd23e5092606))
* update documentation for single workspace structure and add development guide ([6660e68](https://github.com/jubstaaa/hono-telescope/commit/6660e68e4f3bef0508218255004bd4f6ba2e3edc))
* update live demo url to production digital ocean instance ([b69491e](https://github.com/jubstaaa/hono-telescope/commit/b69491e96f7f10373959830b02a59f01365c0856))


### ✅ Tests

* add comprehensive unit tests for core modules ([ec3b836](https://github.com/jubstaaa/hono-telescope/commit/ec3b836e4b527a17466b592e29bcf9bd397d26b4))


### 🏗️ Build

* add prettier as dev dependency and format project ([cbfb274](https://github.com/jubstaaa/hono-telescope/commit/cbfb2743dde474f33d42602da253cfc374008896))
* include @hono-telescope/types in core package build ([1451a47](https://github.com/jubstaaa/hono-telescope/commit/1451a4711563db065f25ca6f5c1a483becc7ab77))
* remove generated dist files ([9433772](https://github.com/jubstaaa/hono-telescope/commit/943377235a2ab714a549e39e890a4256fe64fa93))
* **scripts:** ensure dashboard assets and html are copied to dist properly ([6a74b4f](https://github.com/jubstaaa/hono-telescope/commit/6a74b4fbc633268fd55ea820f78d5b31c6826abe))
* setup eslint with typescript support ([86f4cf0](https://github.com/jubstaaa/hono-telescope/commit/86f4cf075b71552379bc8b16e6cd69bc12f93e69))

## [0.1.17](https://github.com/jubstaaa/hono-telescope/compare/0.1.16...0.1.17) (2025-11-04)


### ✨ Features

* **build:** optimize dashboard bundle size\n\n- Add granular manualChunks (ui-antd, react-core, router, state, utils, http, ui-utils, app)\n- Enable terser minification with drop_console/drop_debugger and mangle\n- Report compressed sizes; tighten chunk size warning threshold\n- Prebundle critical deps via optimizeDeps.include\n- Add terser and babel-plugin-import to devDependencies\n\nImpact: raw ~1.2MB total, gzip ~385KB; removed duplicated multi-MB bundles. ([7b178d1](https://github.com/jubstaaa/hono-telescope/commit/7b178d11d83efeb06a37728bc419d7a4a45f534f))

## [0.1.16](https://github.com/jubstaaa/hono-telescope/compare/0.1.15...0.1.16) (2025-11-04)


### ✨ Features

* **telescope:** add clear data and live mode features ([fb076ad](https://github.com/jubstaaa/hono-telescope/commit/fb076adfc75985b42ea0afa7984c831f554f63e3))

## [0.1.15](https://github.com/jubstaaa/hono-telescope/compare/0.1.14...0.1.15) (2025-11-01)


### ✨ Features

* **exception:** sanitize sensitive headers in exception context ([e826737](https://github.com/jubstaaa/hono-telescope/commit/e8267378b6b2671b0fa698b9057bba795c036fb9))

## [0.1.14](https://github.com/jubstaaa/hono-telescope/compare/0.1.13...0.1.14) (2025-10-31)


### 🐛 Bug Fixes

* resolve @hono-telescope/types import errors ([74ea8e3](https://github.com/jubstaaa/hono-telescope/commit/74ea8e30b8851c729b59fee68a53e3283e0a7b25)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)
* **types:** resolve @hono-telescope/types module import errors ([c2aaa06](https://github.com/jubstaaa/hono-telescope/commit/c2aaa06e20d5a267ab22d20d4b22ce404b26e912)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)


### 📚 Documentation

* **community:** add contributing guide and issue templates ([06153bb](https://github.com/jubstaaa/hono-telescope/commit/06153bb5097ac096383d71f48c9bacb4cac0149c))

## [0.1.13](https://github.com/jubstaaa/hono-telescope/compare/0.1.12...0.1.13) (2025-10-31)


### 🐛 Bug Fixes

* **security:** finalize header sanitization implementation ([2ab1465](https://github.com/jubstaaa/hono-telescope/commit/2ab1465e9d9c9c4bacf2ac4537270696a1dac1ba))

## [0.1.12](https://github.com/jubstaaa/hono-telescope/compare/v0.1.11...0.1.12) (2025-10-31)


### 🏗️ Build

* **scripts:** ensure dashboard assets and html are copied to dist properly ([5e7c82a](https://github.com/jubstaaa/hono-telescope/commit/5e7c82a9e535fbce7e7fc1496c3bd5dd760126cf))

## [0.1.11](https://github.com/jubstaaa/hono-telescope/compare/0.1.10...0.1.11) (2025-10-31)


### 🐛 Bug Fixes

* **dashboard:** import SVG icon as module and separate roadmap features ([60ce44c](https://github.com/jubstaaa/hono-telescope/commit/60ce44c6366c03c1b7e2cb4191aa5050200ce7c1))

## [0.1.10](https://github.com/jubstaaa/hono-telescope/compare/0.1.9...0.1.10) (2025-10-31)


### ✨ Features

* major UI/UX improvements and filtering enhancements ([db64298](https://github.com/jubstaaa/hono-telescope/commit/db64298146cd9254355144a4239453e653453cdd))

## [0.1.9](https://github.com/jubstaaa/hono-telescope/compare/0.1.8...0.1.9) (2025-10-30)


### ✨ Features

* **deployment:** add docker support and digital ocean deployment guide ([dbc94f4](https://github.com/jubstaaa/hono-telescope/commit/dbc94f4368ad60d2b0c0ac59e7cad1f5bd34a49d))


### 🐛 Bug Fixes

* **docker:** install dev dependencies for build, then clean up ([d050e95](https://github.com/jubstaaa/hono-telescope/commit/d050e9522a2bd62bcd3ee8abba80b1ed402c1b42))


### 📚 Documentation

* update documentation for single workspace structure ([1554657](https://github.com/jubstaaa/hono-telescope/commit/1554657adc26dd843e25ae9594e37fa92e870cdb))
* update documentation for single workspace structure and add development guide ([a4dadcd](https://github.com/jubstaaa/hono-telescope/commit/a4dadcd75ab28dd033bde24ac4b6a5c96e433622))
* update live demo url to production digital ocean instance ([be27c87](https://github.com/jubstaaa/hono-telescope/commit/be27c872729e7c766173860808db3fc6c16fca9d))

## [0.1.8](https://github.com/jubstaaa/hono-telescope/compare/v0.1.7...0.1.8) (2025-10-30)


### ✨ Features

* **project:** restructure to monorepo and improve hono compatibility ([62e92d7](https://github.com/jubstaaa/hono-telescope/commit/62e92d7d53ba3f9394c208bb8864ccbebde6731e))

## [0.1.7](https://github.com/jubstaaa/hono-telescope/compare/v%s...v%s) (2025-10-30)


### 🐛 Bug Fixes

* correct sed command in build script ([71ded73](https://github.com/jubstaaa/hono-telescope/commit/71ded7331b43361582c404fe7b630506077fc391))
* replace @hono-telescope/types imports in dist files ([4652343](https://github.com/jubstaaa/hono-telescope/commit/4652343fbdb26a24bdd2aa45b207b06cc93f4273))
* use node script instead of sed for import replacement ([3879ad2](https://github.com/jubstaaa/hono-telescope/commit/3879ad2afd27f0d2842215d1e288a9add836aa15))


### 💎 Styling

* ignore CHANGELOG.md from prettier formatting ([c198089](https://github.com/jubstaaa/hono-telescope/commit/c1980894782acbcadc8b21f9a3757e9b1f8f3784))


### 📚 Documentation

* add professional open source governance files ([a7fdbfd](https://github.com/jubstaaa/hono-telescope/commit/a7fdbfd193d736e70ea4a3f8b1a6854b2389897c))
* formatting improvements in MONOREPO.md ([618352c](https://github.com/jubstaaa/hono-telescope/commit/618352c8a6af0d71267b757db79c9ce097ac4416))


### 🏗️ Build

* include @hono-telescope/types in core package build ([7f2db17](https://github.com/jubstaaa/hono-telescope/commit/7f2db17458311853da7c034de5e41adba46e1bdf))

## [0.1.6](https://github.com/jubstaaa/hono-telescope/compare/v%s...v%s) (2025-10-30)


### 🐛 Bug Fixes

* replace @hono-telescope/types imports in dist files ([4652343](https://github.com/jubstaaa/hono-telescope/commit/4652343fbdb26a24bdd2aa45b207b06cc93f4273))


### 💎 Styling

* ignore CHANGELOG.md from prettier formatting ([c198089](https://github.com/jubstaaa/hono-telescope/commit/c1980894782acbcadc8b21f9a3757e9b1f8f3784))


### 📚 Documentation

* add professional open source governance files ([a7fdbfd](https://github.com/jubstaaa/hono-telescope/commit/a7fdbfd193d736e70ea4a3f8b1a6854b2389897c))
* formatting improvements in MONOREPO.md ([618352c](https://github.com/jubstaaa/hono-telescope/commit/618352c8a6af0d71267b757db79c9ce097ac4416))


### 🏗️ Build

* include @hono-telescope/types in core package build ([7f2db17](https://github.com/jubstaaa/hono-telescope/commit/7f2db17458311853da7c034de5e41adba46e1bdf))

## [0.1.5](https://github.com/jubstaaa/hono-telescope/compare/v%s...v%s) (2025-10-30)


### 📚 Documentation

* add professional open source governance files ([a7fdbfd](https://github.com/jubstaaa/hono-telescope/commit/a7fdbfd193d736e70ea4a3f8b1a6854b2389897c))
* formatting improvements in MONOREPO.md ([618352c](https://github.com/jubstaaa/hono-telescope/commit/618352c8a6af0d71267b757db79c9ce097ac4416))


### 🏗️ Build

* include @hono-telescope/types in core package build ([7f2db17](https://github.com/jubstaaa/hono-telescope/commit/7f2db17458311853da7c034de5e41adba46e1bdf))

## [0.1.4](https://github.com/jubstaaa/hono-telescope/compare/v%s...v%s) (2025-10-30)

### 📚 Documentation

- add professional open source governance files ([a7fdbfd](https://github.com/jubstaaa/hono-telescope/commit/a7fdbfd193d736e70ea4a3f8b1a6854b2389897c))
- formatting improvements in MONOREPO.md ([618352c](https://github.com/jubstaaa/hono-telescope/commit/618352c8a6af0d71267b757db79c9ce097ac4416))

## 0.1.3 (2025-10-30)

### ✨ Features

- Add Axios interceptor support and release v0.1.0-beta.2 ([06378d2](https://github.com/jubstaaa/hono-telescope/commit/06378d245a9c9c378d3ab085c65e930c402cb53e))
- initial release of @hono/telescope v0.1.0-beta.1 ([c4d6376](https://github.com/jubstaaa/hono-telescope/commit/c4d6376f22331bff43e2e6d2da23c70b0bceae98))

### 🐛 Bug Fixes

- **core:** resolve all linter errors and improve database interceptor ([ec105b1](https://github.com/jubstaaa/hono-telescope/commit/ec105b1bbe1c68ee2f4632fe66619680d83b5e86))

### ♻️ Refactoring

- convert to turborepo monorepo structure ([ec4a443](https://github.com/jubstaaa/hono-telescope/commit/ec4a4436286bee36c4af13e714afb3a3910722dd))
- **core,dashboard:** complete type system overhaul and API restructuring ([5fa775d](https://github.com/jubstaaa/hono-telescope/commit/5fa775d89a95f74ba78eb803ae3180a3c2497199))
- restructure project with clean architecture and improved organization ([536b21c](https://github.com/jubstaaa/hono-telescope/commit/536b21cee4ad5a8974be141dff2648ea481ca563))

### 💎 Styling

- **core:** format database interceptor with prettier ([64493f3](https://github.com/jubstaaa/hono-telescope/commit/64493f38b03ddb57b2a5124e50a5cce05238e684))

### 🏗️ Build

- add prettier as dev dependency and format project ([5877310](https://github.com/jubstaaa/hono-telescope/commit/58773104ed5fe8bceefbc3964eba42f103e3f615))
- remove generated dist files ([9433772](https://github.com/jubstaaa/hono-telescope/commit/943377235a2ab714a549e39e890a4256fe64fa93))
- setup eslint with typescript support ([86f4cf0](https://github.com/jubstaaa/hono-telescope/commit/86f4cf075b71552379bc8b16e6cd69bc12f93e69))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: This changelog is automatically generated by [release-it](https://github.com/release-it/release-it) using [Conventional Commits](https://www.conventionalcommits.org/).

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
- **Performance Metrics** - Response time and other performance indicators
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

### 📦 Package Information

- **Package Name**: `hono-telescope`
- **Version**: `0.1.0-beta.1`
- **License**: MIT
- **Author**: İlker Balcılar
- **Repository**: https://github.com/jubstaaa/hono-telescope

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
