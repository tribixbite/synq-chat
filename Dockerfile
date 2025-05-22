# syntax = docker/dockerfile:1

# Use bun image for throw-away build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Install packages needed to build dependencies
RUN apt-get update -qq && \
	apt-get install -y build-essential pkg-config python-is-python3

# Copy package files and config
COPY --link package.json bun.lockb tsconfig.json ./
COPY --link vite.config.ts bun.lock./

# Copy source code and app code
COPY --link src ./src
COPY --link apps ./apps
COPY --link public ./public

# Install dependencies
RUN bun install --frozen-lockfile --ignore-scripts

# Lint and type-check (optional in Docker build, but good for CI consistency)
# RUN bun run biome ci .
# RUN bun run tsc --noEmit # tsc is run by individual app builds if needed via vite

# Build frontend apps
RUN bun run build:vibesynq
RUN bun run build:admin

# Compile backend
RUN bun run compile

# Ensure the compiled output is executable
RUN chmod +x ./main

# Minimalist final stage for app image
FROM gcr.io/distroless/base

WORKDIR /app

# Copy compiled backend
COPY --from=build /app/main /app/main

# Copy static assets from the root public folder
COPY --from=build /app/public /app/public

# Copy built frontend apps
COPY --from=build /app/apps/vibesynq/public /app/apps/vibesynq/public
COPY --from=build /app/apps/admin/public /app/apps/admin/public

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Run compiled server
ENTRYPOINT ["./main"]
