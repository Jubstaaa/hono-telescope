# syntax=docker/dockerfile:1

# ─── deps ────────────────────────────────────────────────────────────────
# The full install, not --production: this image serves the example app, which
# imports axios and dayjs, and both are devDependencies of the library. Pruning
# them leaves an image that cannot start.
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ─── build ───────────────────────────────────────────────────────────────
# `bun run build` runs vite, inlines the dashboard bundle into
# src/core/hono/dashboard-assets.ts, then tsc — so dist carries the library and
# the example together. publishBuild is deliberately not used: it strips
# dist/example, which is exactly what this image serves.
#
# The second step bundles the example into one file so the runner needs no
# node_modules at all. node_modules is 295MB here and almost all of it (antd,
# typescript, babel) is build-time only, while the example's entire runtime
# surface is axios, dayjs, hono and the bun:sqlite builtin.
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build \
    && bun build dist/example/index.js --target=bun --outfile=server.js

# ─── runner ──────────────────────────────────────────────────────────────
# Bun, not Node: the example reads its data through bun:sqlite.
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 telescope \
    && adduser --system --uid 1001 telescope

COPY --from=build --chown=telescope:telescope /app/server.js ./server.js

# The example opens example.db relative to the working directory, so the
# runtime user has to be able to create it there.
RUN chown telescope:telescope /app

USER telescope
EXPOSE 3000

CMD ["bun", "server.js"]
