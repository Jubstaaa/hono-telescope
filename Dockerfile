FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install all dependencies (including dev dependencies for build)
RUN bun install

# Copy source code
COPY . .

# Build
RUN bun run build

# Remove dev dependencies for smaller image
RUN bun install --production

# Expose port
EXPOSE 3000

# Start example app
CMD ["bun", "run", "dev:example"]
