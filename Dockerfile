FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --production

# Copy source code
COPY . .

# Build
RUN bun run build

# Expose port
EXPOSE 3000

# Start example app
CMD ["bun", "run", "dev:example"]
