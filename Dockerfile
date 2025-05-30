# syntax = docker/dockerfile:1

# Use bun image for throw-away build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Install packages needed to build dependencies
RUN apt-get update -qq && \
	apt-get install -y build-essential pkg-config python-is-python3

# Copy package files and config
COPY --link package.json bun.lockb tsconfig.json ./
COPY --link vite.config.ts bun.lock ./
COPY --link lefthook.ts lefthook.json ./

# Copy source code and app code
COPY --link src ./src
COPY --link apps ./apps
# Copy the original root public assets to a temporary distinguished name
COPY --link public ./public_root_assets 

# Install dependencies with proper flags for Docker
RUN bun install --frozen-lockfile --ignore-scripts

# Lint and type-check (optional in Docker build, but good for CI consistency)
# RUN bun run biome ci .
# RUN bun run tsc --noEmit # tsc is run by individual app builds if needed via vite

# Build frontend apps (they now build to their own dist/ folders)
# Ensure build:all or individual build scripts are correct in package.json
RUN bun run build:all 

# Compile backend
RUN bun run compile

# Ensure the compiled output is executable
RUN chmod +x ./main

# Create the target public structure in the build stage
RUN mkdir -p /app/public_final/apps/vibesynq && mkdir -p /app/public_final/apps/admin

# Copy built frontend apps to the structured public directory
RUN cp -r /app/apps/vibesynq/dist/* /app/public_final/apps/vibesynq/
RUN cp -r /app/apps/admin/dist/* /app/public_final/apps/admin/

# Copy other root public assets to the final public directory
RUN cp -r /app/public_root_assets/* /app/public_final/

# Minimalist final stage for app image
FROM gcr.io/distroless/base

WORKDIR /app

# Copy compiled backend
COPY --from=build /app/main /app/main

# Copy the complete public directory structure from build stage
COPY --from=build /app/public_final /app/public

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Run compiled server
ENTRYPOINT ["./main"]
