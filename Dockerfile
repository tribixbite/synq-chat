# syntax = docker/dockerfile:1

# Use bun image for throw-away build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Install packages needed to build dependencies
RUN apt-get update -qq && \
	apt-get install -y build-essential pkg-config python-is-python3

# Copy package manager files
COPY --link bun.lockb package.json tsconfig.json ./
# COPY --link bun.lockb ./

# Copy application code
# Copy only necessary files for build to leverage Docker cache
COPY --link src ./src
COPY --link apps ./apps

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

# Copy static assets from the root public folder (if any, like favicons)
COPY --from=build /app/public /app/public

# Copy built frontend apps (their public directories)
COPY --from=build /app/apps/vibesynq/public /app/apps/vibesynq/public
COPY --from=build /app/apps/admin/public /app/apps/admin/public

# Expose port and define entrypoint
EXPOSE 3000
ENTRYPOINT ["./main"]
