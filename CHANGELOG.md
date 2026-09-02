

## Unreleased


### ✨ Features

* **mcp:** declare `annotations: { readOnlyHint: true, openWorldHint: false }` on all five tools
  and give every input parameter a description, so an agent can tell a tool is safe to call and
  what each argument means without reading the source. `stats` now says its counts cover only
  the entries still retained — the oldest are dropped at `maxEntries` — and points at the tools
  to drill in with; `request_detail` says where a request id comes from; `slow_queries` and
  `request_detail` name the sibling tool to reach for next. A test pins parameter-description
  coverage, so a future parameter cannot ship bare.


## [1.2.0](https://github.com/jubstaaa/hono-telescope/compare/1.1.1...1.2.0) (2026-09-02)


### ✨ Features

* **cli:** bridge a stdio-only MCP client to the HTTP endpoint the dashboard serves — new
  `hono-telescope mcp-stdio --url <endpoint>` bin. It relays one JSON-RPC message per line
  between stdin/stdout and the endpoint, forwarding requests concurrently so a slow tool call
  never blocks the ones behind it, and it keeps a non-JSON response (a `404`, an HTML page, a
  dead connection) out of stdout by answering with a JSON-RPC error carrying the request's own
  `id`. Method dispatch, version negotiation and error codes stay in the HTTP server: the
  bridge implements no protocol of its own and adds no runtime dependency. Auth travels as a
  repeatable `--header`, or `TELESCOPE_HEADER` for clients that can only pass environment
  variables.


## [1.1.1](https://github.com/jubstaaa/hono-telescope/compare/1.1.0...1.1.1) (2026-09-02)


### 🐛 Bug Fixes

* **build:** publish the current compiled tree. A test that imported `package.json` made it a
  TypeScript program input, which moved tsc's inferred root directory up a level and emitted
  everything under `dist/src/` while `exports` kept pointing at the stale `dist/index.js` left
  over from an earlier build. 1.1.0 therefore shipped without the failed-query, outgoing-payload
  and array-wrapping changes its own entry advertises, and is deprecated on npm. `build` now
  removes `dist` first, and `verify:dist` fails if a `dist/src/` tree ever reappears.


## [1.1.0](https://github.com/jubstaaa/hono-telescope/compare/1.0.0...1.1.0) (2026-09-02)


### ✨ Features

* **mcp:** serve an MCP endpoint from the dashboard so AI agents can read live telemetry — five
  read-only tools (`recent_exceptions`, `recent_requests`, `request_detail`, `slow_queries`,
  `stats`) over the existing `StorageAdapter`, with no new runtime dependency and no change to
  the storage contract. Streamable HTTP (`2026-07-28`, with `2025-11-25` accepted), covered by
  `dashboard.auth` and the production guard.
* **instrumentation:** record a failed query distinctly from a successful one — new optional
  `failed` and `error` fields on the query entry, populated by the Prisma, MongoDB and Bun
  SQLite instrumentations, surfaced in the dashboard and over MCP. Prisma and Bun SQLite
  previously recorded a throwing query as if it had succeeded; the error is still rethrown
  untouched. Sequelize is not covered — see the README.
* **collectors:** capture the request payload of an outgoing `fetch` when the body is already
  in memory (string, `URLSearchParams`, `ArrayBuffer`), with the same cap and redaction as
  every other body. Stream, `FormData`, `Blob` and `Request`-object bodies are skipped so that
  recording never consumes what the caller is sending.


### 🐛 Bug Fixes

* **capture:** wrap a JSON array body so a recorded body is always an object — `{ body: [...] }`
  for requests, `{ response: [...] }` for responses. An array was previously stored raw while
  the entry type declared an object.


## [1.0.0](https://github.com/jubstaaa/hono-telescope/compare/0.1.18...1.0.0) (2026-09-02)

The core has been rewritten. 0.x was a private-constructor singleton that monkey-patched
globals at import time and never undid it; 1.0 is an instance-based core with a single
public entry point, symmetric install/uninstall, and zero runtime dependencies.

```typescript
import { Hono } from 'hono';
import { createTelescope, memoryStorage } from 'hono-telescope';

const app = new Hono();
const telescope = createTelescope({ storage: memoryStorage({ maxEntries: 1000 }) });

app.use('*', telescope.middleware());
app.route('/telescope', telescope.dashboard());
```

See [Upgrading from 0.x](./README.md#upgrading-from-0x) for the full migration.

### ⚠ BREAKING CHANGES

- **`setupTelescope` has been removed.** `createTelescope(config)` returns a telescope
  instance and you mount its two halves yourself: `app.use('*', telescope.middleware())`
  and `app.route('/telescope', telescope.dashboard())`. No compatibility shim ships — 0.x
  code will not run against 1.0.
- **The singleton core has been removed.** Telescope is instantiated, not summoned;
  importing the package no longer patches `console`, `fetch`, or process handlers as a
  side effect. The collectors patch when you call `createTelescope()` and `telescope.stop()`
  uninstalls them again (a mounted middleware keeps recording after `stop()`).
- **Configuration keys are camelCase.** `max_entries` → `memoryStorage({ maxEntries })`,
  `sanitize_headers` → `redact.headers`, and every other snake_case key is renamed. Storage
  sizing now lives on the storage adapter rather than the top-level config.
- **`sanitizeHeaders` is gone**, replaced by `redact.headers` and `redact.bodyKeys`, which
  redact recursively at any nesting depth, case-insensitively, in bodies as well as headers.
- **Automatic database interception has been removed** in favour of explicit per-client
  instrumentation: `telescope.instrumentPrisma`, `instrumentSequelize`, `instrumentMongo`,
  `instrumentBunSqlite`. The automatic path never worked under Node ESM and captured only
  raw SQL where it did run. **`instrumentPrisma` returns a new client** (Prisma's `$extends`
  is immutable) — you must use the returned value. Call each `instrument*` once per client;
  they are not idempotent.
- **Axios interception has been removed.** Axios on Node does not use `fetch`, so the
  interceptor never observed those requests.
- **`peerDependencies.hono` is now `>=4.0.0`** and `hono` is a peer dependency only. The
  package has no runtime dependencies.
- **ESM only.** No CommonJS build and no `require()`; `engines` are Node `>=18` and Bun `>=1.0`.
- **Only two entry points are public**, enforced by an `exports` map: `hono-telescope` and
  `hono-telescope/testing`. Deep imports into `dist/` no longer resolve.
- **`dashboardPath` must match the path you mount the dashboard at.** The middleware uses it
  to skip the dashboard's own traffic and the dashboard uses it to build its base URL.
- **The dashboard refuses to mount unauthenticated in production.** With `enabled: true` and
  `NODE_ENV === 'production'`, omitting `dashboard.auth` throws; pass credentials, or
  `dashboard.auth: false` to acknowledge full exposure explicitly.
- **`EntryType` is a union type, not an enum**, and the entry payloads are keyed by type maps.

### ✨ Features

- **core:** `createTelescope` factory replacing the singleton, with a `stop()` that uninstalls
  the collectors ([5e8b1da](https://github.com/jubstaaa/hono-telescope/commit/5e8b1da), [1c2979b](https://github.com/jubstaaa/hono-telescope/commit/1c2979b))
- **storage:** `StorageAdapter` contract plus a functional `memoryStorage` adapter ([1996064](https://github.com/jubstaaa/hono-telescope/commit/1996064))
- **context:** `ContextStrategy` abstraction with an `alsContext()` AsyncLocalStorage
  implementation, so child entries correlate to their parent request ([61d2f56](https://github.com/jubstaaa/hono-telescope/commit/61d2f56), [facfb65](https://github.com/jubstaaa/hono-telescope/commit/facfb65))
- **collectors:** `consoleCollector`, `exceptionCollector` and `fetchCollector`, each with
  symmetric install and uninstall ([0239233](https://github.com/jubstaaa/hono-telescope/commit/0239233), [bf72074](https://github.com/jubstaaa/hono-telescope/commit/bf72074)). Pass `collectors: []` to disable all of them.
- **hono:** request middleware that observes failures instead of hijacking `onError` — a
  request whose handler throws is recorded with the status your own `onError` returned, and
  the exception is recorded as a child of that request ([0b17708](https://github.com/jubstaaa/hono-telescope/commit/0b17708))
- **hono:** the dashboard is a mountable Hono sub-app with optional basic auth and a
  configurable base path ([2a6954a](https://github.com/jubstaaa/hono-telescope/commit/2a6954a))
- **instrumentation:** explicit Prisma, Sequelize, MongoDB and Bun SQLite query capture ([559c43c](https://github.com/jubstaaa/hono-telescope/commit/559c43c))
- **core:** capped, content-type-aware body capture — `capture.maxBodySize` defaults to 64 KB
  and larger bodies are stored as `{ truncated: true, size }` metadata ([68a299f](https://github.com/jubstaaa/hono-telescope/commit/68a299f))
- **core:** recursive body and header redaction ([0f45b76](https://github.com/jubstaaa/hono-telescope/commit/0f45b76))
- **core:** config resolution with safe defaults — every option is optional ([fd396f4](https://github.com/jubstaaa/hono-telescope/commit/fd396f4))
- `hono-telescope/testing` exports `runStorageContract`, so a custom `StorageAdapter` can be
  verified against the ordering guarantees the dashboard relies on ([5db7c9a](https://github.com/jubstaaa/hono-telescope/commit/5db7c9a))

### 🐛 Bug Fixes

- **capture:** streamed responses are no longer buffered — recording never delays or consumes
  a `streamText`/`streamSSE` response ([4f7de7e](https://github.com/jubstaaa/hono-telescope/commit/4f7de7e))
- **capture:** store metadata only for truncated response bodies, and do not await reader
  cancellation on the truncation path — a response over `maxBodySize` could previously hang
  the request forever ([d1de866](https://github.com/jubstaaa/hono-telescope/commit/d1de866), [1f334f7](https://github.com/jubstaaa/hono-telescope/commit/1f334f7))
- **core:** redaction no longer allows prototype pollution and deep-copies before redacting ([27d8e62](https://github.com/jubstaaa/hono-telescope/commit/27d8e62))
- **core:** off-by-one in the truncation flag of `readCappedText` ([c2805b3](https://github.com/jubstaaa/hono-telescope/commit/c2805b3))
- **core:** use `node:crypto`'s `randomUUID` instead of the bare `crypto` global, which does
  not exist on Node 18 ([ec00ab8](https://github.com/jubstaaa/hono-telescope/commit/ec00ab8))
- **core:** close the remaining paths where the recording layer could throw into, or delay,
  the caller; fix `ignorePaths` matching ([ad72f98](https://github.com/jubstaaa/hono-telescope/commit/ad72f98))
- **collectors:** capture headers from the `Request`, record response headers, and guard
  response capture ([2d16ea9](https://github.com/jubstaaa/hono-telescope/commit/2d16ea9))
- **instrumentation:** guard Prisma binding serialization and dedupe Bun SQLite statement
  wrapping ([9c493f8](https://github.com/jubstaaa/hono-telescope/commit/9c493f8))
- **hono:** escape angle brackets in the injected base path ([a603d65](https://github.com/jubstaaa/hono-telescope/commit/a603d65))
- **dashboard:** surface clear-data failures instead of silently swallowing them, and share
  the base-path fallback ([04c8540](https://github.com/jubstaaa/hono-telescope/commit/04c8540), [d562888](https://github.com/jubstaaa/hono-telescope/commit/d562888))
- **build:** emit Node-loadable ESM — the published package could not be imported on Node at
  all ([781f713](https://github.com/jubstaaa/hono-telescope/commit/781f713))

### ♻️ Refactoring

- remove the singleton core ahead of the 1.0 rebuild ([1c2979b](https://github.com/jubstaaa/hono-telescope/commit/1c2979b))
- **types:** replace the `EntryType` enum with a union and add entry type maps ([a006036](https://github.com/jubstaaa/hono-telescope/commit/a006036))
- **dashboard:** replace Redux Toolkit with a small fetch hook, cutting the dashboard bundle ([8b4fd2a](https://github.com/jubstaaa/hono-telescope/commit/8b4fd2a))
- **example:** move the example app to `createTelescope` and drop the orphaned database
  singleton ([bed0dee](https://github.com/jubstaaa/hono-telescope/commit/bed0dee), [c1a0929](https://github.com/jubstaaa/hono-telescope/commit/c1a0929))

### 📚 Documentation

- rewrite the README for the 1.0 API, including an "Upgrading from 0.x" guide ([d8d402a](https://github.com/jubstaaa/hono-telescope/commit/d8d402a))
- document the auth opt-out, the redaction defaults, and what `stop()` does and does not
  tear down ([8437ef7](https://github.com/jubstaaa/hono-telescope/commit/8437ef7), [aa62ab4](https://github.com/jubstaaa/hono-telescope/commit/aa62ab4))
- document the real limitations: outgoing request bodies, streamed responses and
  over-cap bodies are not captured ([1a06a7e](https://github.com/jubstaaa/hono-telescope/commit/1a06a7e))

### ✅ Tests

- 129 tests across 16 files covering the public API end to end ([1a06a7e](https://github.com/jubstaaa/hono-telescope/commit/1a06a7e))

### 🏗️ Build

- ship zero runtime dependencies and add an `exports` map ([4c1ea4d](https://github.com/jubstaaa/hono-telescope/commit/4c1ea4d))
- strip tests, the example and the dashboard sources from the published package ([a5939a3](https://github.com/jubstaaa/hono-telescope/commit/a5939a3))
- gate the published artifact on `dist` actually importing under both Node and Bun ([781f713](https://github.com/jubstaaa/hono-telescope/commit/781f713))
- inline dashboard assets as strings, and fail the inliner when there is nothing to inline ([68a8af4](https://github.com/jubstaaa/hono-telescope/commit/68a8af4), [52407bb](https://github.com/jubstaaa/hono-telescope/commit/52407bb))


## 0.1.18 (2026-03-12)


### ✨ Features

* Add Axios interceptor support and release v0.1.0-beta.2 ([06378d2](https://github.com/jubstaaa/hono-telescope/commit/06378d245a9c9c378d3ab085c65e930c402cb53e))
* **build:** optimize dashboard bundle size\n\n- Add granular manualChunks (ui-antd, react-core, router, state, utils, http, ui-utils, app)\n- Enable terser minification with drop_console/drop_debugger and mangle\n- Report compressed sizes; tighten chunk size warning threshold\n- Prebundle critical deps via optimizeDeps.include\n- Add terser and babel-plugin-import to devDependencies\n\nImpact: raw ~1.2MB total, gzip ~385KB; removed duplicated multi-MB bundles. ([655a8c1](https://github.com/jubstaaa/hono-telescope/commit/655a8c1fec9a4a4b383e37a0bd3458fe0ef126f2))
* **deployment:** add docker support and digital ocean deployment guide ([47d7eaa](https://github.com/jubstaaa/hono-telescope/commit/47d7eaa91073a8afb9c2c9b31b2717045f3e5fee))
* **exception:** sanitize sensitive headers in exception context ([0db825d](https://github.com/jubstaaa/hono-telescope/commit/0db825d63d2d8668e38b0554987a544f5a7dd047))
* initial release of @hono/telescope v0.1.0-beta.1 ([c4d6376](https://github.com/jubstaaa/hono-telescope/commit/c4d6376f22331bff43e2e6d2da23c70b0bceae98))
* major UI/UX improvements and filtering enhancements ([1d9276c](https://github.com/jubstaaa/hono-telescope/commit/1d9276c861431aa6323c8f6bccca8c380321e5c4))
* **project:** restructure to monorepo and improve hono compatibility ([c6e814c](https://github.com/jubstaaa/hono-telescope/commit/c6e814cb223b8ac7172924e5f996cee116605ae3))
* **telescope:** add clear data and live mode features ([ba487cf](https://github.com/jubstaaa/hono-telescope/commit/ba487cf2d754f5a23414798915f672d72e9ca696))


### 🐛 Bug Fixes

* add npm OTP support to release config ([989aa16](https://github.com/jubstaaa/hono-telescope/commit/989aa16b6207ea6fe444d632fdf56dc16272600a))
* address cursor bot review feedback ([ad04d5e](https://github.com/jubstaaa/hono-telescope/commit/ad04d5e55ddd5e19b135fb4f039462469b615e65))
* **core:** resolve all linter errors and improve database interceptor ([3262bb6](https://github.com/jubstaaa/hono-telescope/commit/3262bb603406cb0ee12cc0d0781122aebdd24c8b))
* correct sed command in build script ([7711b10](https://github.com/jubstaaa/hono-telescope/commit/7711b10f7b9ab1f5e7bdcca3cacf9d912707536b))
* **dashboard:** import SVG icon as module and separate roadmap features ([9c6b9e9](https://github.com/jubstaaa/hono-telescope/commit/9c6b9e92b83d46f5c073ae2d3023068da3e52271))
* **docker:** install dev dependencies for build, then clean up ([17e730a](https://github.com/jubstaaa/hono-telescope/commit/17e730afa677ab8fbb74e5f38afe4885b03d8b02))
* remove broken otp config from release-it ([846b41f](https://github.com/jubstaaa/hono-telescope/commit/846b41f60346c34adfdf467c1d06d401da8dd20c))
* replace @hono-telescope/types imports in dist files ([d6524cd](https://github.com/jubstaaa/hono-telescope/commit/d6524cd48ef94f6bf81cdd76898c84231fef1d63))
* resolve @hono-telescope/types import errors ([ae798d6](https://github.com/jubstaaa/hono-telescope/commit/ae798d6ec2201a2b54d18a1249ee7ca70bfcc5c3)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)
* resolve eslint errors, add lint and test to CI and release pipeline ([3a486e0](https://github.com/jubstaaa/hono-telescope/commit/3a486e03a66676b720e97f2f2a1690f60c0e903c))
* **security:** finalize header sanitization implementation ([f9c5af6](https://github.com/jubstaaa/hono-telescope/commit/f9c5af6604a72c1c66fc9747f55c4157e82e80a8))
* **types:** resolve @hono-telescope/types module import errors ([50c5637](https://github.com/jubstaaa/hono-telescope/commit/50c5637c8785d9e6f3f71593daa62f97b618752b)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)
* use node script instead of sed for import replacement ([91a8a2e](https://github.com/jubstaaa/hono-telescope/commit/91a8a2e42d892516944970f30c96c49829d24195))


### ♻️ Refactoring

* comprehensive bug fixes, cleanup, and dependency optimization ([7299014](https://github.com/jubstaaa/hono-telescope/commit/72990141bb41418e23099367ee051ec5434dc1ba))
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

* add comprehensive unit tests for core modules ([5fc87a1](https://github.com/jubstaaa/hono-telescope/commit/5fc87a1ce1d250d6c60ef45330c85cf446120c12))


### 🏗️ Build

* add prettier as dev dependency and format project ([cbfb274](https://github.com/jubstaaa/hono-telescope/commit/cbfb2743dde474f33d42602da253cfc374008896))
* include @hono-telescope/types in core package build ([1451a47](https://github.com/jubstaaa/hono-telescope/commit/1451a4711563db065f25ca6f5c1a483becc7ab77))
* remove generated dist files ([9433772](https://github.com/jubstaaa/hono-telescope/commit/943377235a2ab714a549e39e890a4256fe64fa93))
* **scripts:** ensure dashboard assets and html are copied to dist properly ([6a74b4f](https://github.com/jubstaaa/hono-telescope/commit/6a74b4fbc633268fd55ea820f78d5b31c6826abe))
* setup eslint with typescript support ([86f4cf0](https://github.com/jubstaaa/hono-telescope/commit/86f4cf075b71552379bc8b16e6cd69bc12f93e69))

## [0.1.17](https://github.com/jubstaaa/hono-telescope/compare/0.1.16...0.1.17) (2025-11-04)


### ✨ Features

* **build:** optimize dashboard bundle size\n\n- Add granular manualChunks (ui-antd, react-core, router, state, utils, http, ui-utils, app)\n- Enable terser minification with drop_console/drop_debugger and mangle\n- Report compressed sizes; tighten chunk size warning threshold\n- Prebundle critical deps via optimizeDeps.include\n- Add terser and babel-plugin-import to devDependencies\n\nImpact: raw ~1.2MB total, gzip ~385KB; removed duplicated multi-MB bundles. ([cf6a5d2](https://github.com/jubstaaa/hono-telescope/commit/cf6a5d2ed6008b50aff1a0755e7e4a110d8f5f1e))

## [0.1.16](https://github.com/jubstaaa/hono-telescope/compare/0.1.15...0.1.16) (2025-11-04)


### ✨ Features

* **telescope:** add clear data and live mode features ([4b2f4f0](https://github.com/jubstaaa/hono-telescope/commit/4b2f4f06acffb446f252d19c56e52868f2075d26))

## [0.1.15](https://github.com/jubstaaa/hono-telescope/compare/0.1.14...0.1.15) (2025-11-01)


### ✨ Features

* **exception:** sanitize sensitive headers in exception context ([f674fd8](https://github.com/jubstaaa/hono-telescope/commit/f674fd8e97518a5109032e0bf4245184b167ea19))

## [0.1.14](https://github.com/jubstaaa/hono-telescope/compare/0.1.13...0.1.14) (2025-10-31)


### 🐛 Bug Fixes

* resolve @hono-telescope/types import errors ([74ea8e3](https://github.com/jubstaaa/hono-telescope/commit/74ea8e30b8851c729b59fee68a53e3283e0a7b25)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)
* **types:** resolve @hono-telescope/types module import errors ([c1319ba](https://github.com/jubstaaa/hono-telescope/commit/c1319bad6506131818f16eabc894746ca1f3ca22)), closes [#1](https://github.com/jubstaaa/hono-telescope/issues/1)


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
