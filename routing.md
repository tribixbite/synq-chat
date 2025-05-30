# Routing System Documentation

This document provides a comprehensive guide to the Synq platform's sophisticated routing system, covering subdomain routing, path-based routing, static file serving, and how development vs production environments work.

## Overview

The Synq platform implements a multi-layered routing system that handles:

1. **Subdomain-based routing** (e.g., `admin.domain.com`, `vibesynq.domain.com`)
2. **Path-based routing** (e.g., `/apps/admin/`, `/apps/vibesynq/`)
3. **Static file serving** with proper MIME types and caching
4. **SPA fallback routing** for React applications
5. **Direct file access** for standalone content

## Architecture Components

### 1. Server Components

#### Main Server (`src/server/index.ts`)
The primary ElysiaJS server that orchestrates all routing:

```typescript
// Core server setup with plugins
const app = new Elysia()
  .use(staticFilePlugin)     // Handles all static file serving
  .use(subdomainPlugin)      // Subdomain and path-based routing
  .use(vibesynqAiPlugin)     // AI API endpoints
  .listen(3000);
```

#### Subdomain Plugin (`src/server/plugins/subdomainPlugin.ts`)
Handles all routing logic with sophisticated subdomain and path detection:

```typescript
export const subdomainPlugin = new Elysia({ name: "subdomain" })
  .derive(({ request, set }) => {
    const url = new URL(request.url);
    const subdomain = extractSubdomain(url.hostname);
    return { subdomain, pathname: url.pathname };
  })
  .get("*", ({ subdomain, pathname, set }) => {
    // Route logic based on subdomain and pathname
  });
```

### 2. Static File Serving

#### Production Build Outputs
Each app builds to its dedicated directory in `public/apps/`:

```
public/
├── apps/
│   ├── admin/              # Built admin React app
│   │   ├── index.html      # Entry point
│   │   ├── assets/         # JS, CSS, images
│   │   └── sw.js           # Service worker
│   └── vibesynq/           # Built vibesynq React app
│       ├── index.html      # Entry point
│       ├── assets/         # JS, CSS, images
│       └── sw.js           # Service worker
├── llm/                # LLM service files
│   └── file.txt        # Example content
├── moto.html           # Standalone Three.js game
└── external-docs/      # Additional static content
```

#### MIME Type Configuration
The server properly handles all file types:

```typescript
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  // ... comprehensive list
};
```

## Routing Rules & Examples

### 1. Subdomain Routing

#### Admin Subdomain
**Pattern:** `admin.domain.com/*`
**Target:** Serves admin React app from `public/apps/admin/` (usually proxied to `/apps/admin/` path by server logic if subdomain directly serves the app's root)

```bash
# Examples
admin.localhost:3000/           → public/apps/admin/index.html
admin.localhost:3000/dashboard  → public/apps/admin/index.html (SPA routing)
admin.localhost:3000/assets/    → public/apps/admin/assets/* (static assets)
```

#### Vibesynq Subdomain
**Pattern:** `vibesynq.domain.com/*`
**Target:** Serves vibesynq React app from `public/apps/vibesynq/`

```bash
# Examples
vibesynq.localhost:3000/        → public/apps/vibesynq/index.html
vibesynq.localhost:3000/create  → public/apps/vibesynq/index.html (SPA routing)
vibesynq.localhost:3000/assets/ → public/apps/vibesynq/assets/* (static assets)
```

#### LLM Subdomain
**Pattern:** `llm.domain.com/*`
**Target:** Serves LLM-specific content from `public/llm/`

```bash
# Examples
llm.localhost:3000/             → public/llm/index.html (if exists)
llm.localhost:3000/file.txt     → public/llm/file.txt
llm.localhost:3000/api/         → API endpoints (if configured)
```

### 2. Path-Based Routing (Fallback)

When subdomain routing isn't available, path-based routing takes over:

#### Admin Path
**Pattern:** `domain.com/apps/admin/*`
**Target:** Serves admin React app with `/apps/admin/` base path

```bash
# Examples
localhost:3000/apps/admin/           → public/apps/admin/index.html
localhost:3000/apps/admin/dashboard  → public/apps/admin/index.html (SPA routing)
localhost:3000/apps/admin/assets/    → public/apps/admin/assets/* (static assets)
```

#### Vibesynq Path
**Pattern:** `domain.com/apps/vibesynq/*`
**Target:** Serves vibesynq React app with `/apps/vibesynq/` base path

```bash
# Examples
localhost:3000/apps/vibesynq/        → public/apps/vibesynq/index.html
localhost:3000/apps/vibesynq/create  → public/apps/vibesynq/index.html (SPA routing)
localhost:3000/apps/vibesynq/assets/ → public/apps/vibesynq/assets/* (static assets)
```

### 3. Direct File Access

#### Root Level Files
**Pattern:** `domain.com/filename.ext`
**Target:** Direct file serving from `public/`

```bash
# Examples
localhost:3000/moto.html        → public/moto.html
localhost:3000/favicon.ico      → public/favicon.ico (if present at root)
localhost:3000/robots.txt       → public/robots.txt (if present at root)
```

#### Nested Static Content
**Pattern:** `domain.com/folder/file.ext`
**Target:** Nested file serving from `public/folder/`

```bash
# Examples
localhost:3000/external-docs/   → public/external-docs/index.html
localhost:3000/beach/assets/    → public/beach/assets/*
localhost:3000/llm/file.txt     → public/llm/file.txt
```

## Development vs Production

### Local Development

#### Vite Dev Servers
Each app runs its own Vite dev server during development:

```bash
# Vibesynq dev server
cd apps/vibesynq && bunx vite
# Serves at http://localhost:5173 (or other port) with /apps/vibesynq/ base

# Admin dev server  
cd apps/admin && bunx vite
# Serves at http://localhost:5174 (or other port) with /apps/admin/ base
```

#### Dev Server Proxying
Vite dev servers proxy API calls to the main server:

```typescript
// Example for apps/vibesynq/vite.config.ts
server: {
  proxy: {
    "/api": { // Assuming your API is served at /api by the main server
      target: "http://localhost:3000", // Main server
      changeOrigin: true
    }
  }
}
```

#### Concurrent Development
Run all services simultaneously:

```bash
# All services
bun run dev

# Individual services
bun run dev:vibesynq  # Server + Vibesynq
bun run dev:admin     # Server + Admin
```

### Production Build Process

#### 1. Build Phase
```bash
# Build all frontend apps
bun run build:vibesynq  # apps/vibesynq/src → apps/vibesynq/dist/
bun run build:admin     # apps/admin/src/client → apps/admin/dist/

# Dockerfile then copies dist contents to public/apps/appname/

# Compile server
bun run compile         # src/server → ./main
```

#### 2. Vite Build Configuration

**Vibesynq Build (`apps/vibesynq/vite.config.ts`):**
```typescript
// Simplified example of the new structure
export default defineConfig({
  root: resolve(__dirname, "src"),       // e.g., apps/vibesynq/src
  base: "/apps/vibesynq/",
  build: {
    outDir: resolve(__dirname, "dist"),  // e.g., apps/vibesynq/dist
    emptyOutDir: true
    // ... PWA options, rollup, etc.
  },
  plugins: [react(), tailwindcss() /*, svgr, viteStaticCopy, etc. */ ]
});
```

**Admin Build (`apps/admin/vite.config.ts`):**
```typescript
// Simplified example of the new structure
export default defineConfig({
  root: resolve(__dirname, "src/client"), // e.g., apps/admin/src/client
  base: "/apps/admin/",
  build: {
    outDir: resolve(__dirname, "dist"),   // e.g., apps/admin/dist
    emptyOutDir: true
    // ... PWA options, rollup, etc.
  },
  plugins: [react() /*, svgr, viteStaticCopy, etc. */]
});
```

## Testing the Routing System

### 1. Local Development Testing

```bash
# Start the full development environment
bun run dev

# Test subdomain routing (requires hosts file modification)
echo "127.0.0.1 admin.localhost vibesynq.localhost llm.localhost" >> /etc/hosts

# Test URLs:
open http://admin.localhost:3000
open http://vibesynq.localhost:3000
open http://llm.localhost:3000
```

### 2. Path-Based Testing

```bash
# Start server only
bun run --hot src/server/index.ts

# Test path-based routing:
curl http://localhost:3000/admin/
curl http://localhost:3000/vibesynq/
curl http://localhost:3000/moto.html
curl http://localhost:3000/llm/file.txt
```

### 3. Production Build Testing

```bash
# Build everything
bun run build

# Test with compiled server
./main

# Test all routes:
curl http://localhost:3000/admin/
curl http://localhost:3000/vibesynq/
curl http://localhost:3000/admin/assets/index.css
curl http://localhost:3000/vibesynq/assets/index.js
```

### 4. Docker Testing

```bash
# Build Docker image
docker build -t synq-chat .

# Run container
docker run -p 3000:3000 synq-chat

# Test routing:
curl http://localhost:3000/admin/
curl http://localhost:3000/vibesynq/
curl http://localhost:3000/moto.html
```

## API Routing

### 1. AI Endpoints
**Base Path:** `/api/`
**Handler:** `vibesynqAiPlugin.ts`

```bash
# Examples
POST /api/ask-ai                # AI chat/generation
GET  /api/health                # Health check
```

### 2. Admin Endpoints
**Base Path:** `/api/admin/`
**Handler:** `adminPlugin.ts` (planned)

```bash
# Examples (planned)
GET  /api/admin/users           # User management
POST /api/admin/content         # Content management
GET  /api/admin/analytics       # Analytics data
```

## File Journey Examples

### Example 1: Vibesynq App Asset
```
Source:  apps/vibesynq/src/assets/logo.svg
Build:   public/vibesynq/assets/logo-[hash].svg
Serve:   GET /vibesynq/assets/logo-[hash].svg
```

### Example 2: Admin App JavaScript
```
Source:  apps/admin/src/client/main.tsx
Build:   public/admin/assets/index-[hash].js
Serve:   GET /admin/assets/index-[hash].js
```

### Example 3: Standalone Game
```
Source:  public/moto.html (direct)
Serve:   GET /moto.html
```

### Example 4: LLM Service File
```
Source:  public/llm/file.txt (direct)
Serve:   GET /llm/file.txt
SubDom:  GET llm.localhost:3000/file.txt
```

## Troubleshooting

### Common Issues

1. **404 for SPA routes**: Ensure index.html fallback is working
2. **Asset 404s**: Check base path configuration in Vite configs
3. **CORS issues**: Verify proxy configuration in dev mode
4. **Subdomain not working**: Check hosts file and DNS configuration

### Debug Commands

```bash
# Check built files
ls -la public/admin/
ls -la public/vibesynq/

# Test specific endpoints
curl -v http://localhost:3000/admin/
curl -v http://localhost:3000/vibesynq/assets/

# Check Docker build
docker run --rm synq-chat ls -la /app/public/
```

This routing system provides a robust foundation for serving multiple applications with proper isolation, asset management, and development workflows. 
