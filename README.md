# Multisynq Monorepo

A multi-app monorepo featuring a central Bun/Elysia server and multiple Vite React applications: **Vibesynq** and **Admin**.

## Structure

- `/src/server` - Main Bun/Elysia server.
- `/apps/vibesynq` - The Vibesynq React application (cyan themed).
- `/apps/admin` - The Admin Panel React application (red/gray themed).
- `/shared` - Shared components, types, constants, and configuration between apps and server.
- `/public` - Root public static files (e.g., favicons).

## Features

- **Multi-App Architecture**: Separate Vite builds for each frontend application.
- **Unified Server**: Single Bun/Elysia backend serving all applications.
- **Flexible Routing**: 
    - Path-based: `/vibesynq/`, `/admin/`.
    - Subdomain-based (requires host file setup for local dev): `vibesynq.localhost:3000`, `admin.localhost:3000`.
- **Shared Code**: Leverage shared components and utilities for consistency and efficiency.
- **Dockerized**: Ready for containerized deployment.

## Development

To run the server and all applications concurrently:
```bash
bun run dev
```

To run a specific application with the server:
```bash
bun run dev:vibesynq
bun run dev:admin
```

## Building for Production

To build all applications and compile the server:
```bash
# 1. Build frontend apps (outputs to apps/vibesynq/public and apps/admin/public)
bun run build:vibesynq
bun run build:admin

# 2. Compile the server (creates ./main executable)
bun run compile 
```

To start the production build locally:
```bash
bun run start # Runs the ./main executable
```

## Docker Deployment

Build the Docker image:
```bash
docker build -t multisynq-monorepo .
```

Run the Docker container:
```bash
docker run -p 3000:3000 multisynq-monorepo
```

## Accessing the Apps (Locally)

- **Vibesynq App**:
  - Path: `http://localhost:3000/vibesynq/`
  - Subdomain: `http://vibesynq.localhost:3000` (after adding `127.0.0.1 vibesynq.localhost admin.localhost` to your hosts file)
- **Admin Panel**:
  - Path: `http://localhost:3000/admin/`
  - Subdomain: `http://admin.localhost:3000` (after hosts file update)

Default root access `http://localhost:3000/` redirects to the Vibesynq app.
