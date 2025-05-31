# Routing System Documentation - Updated

This document provides a comprehensive guide to the Synq platform's sophisticated routing system, covering subdomain routing, path-based routing, static file serving, and how development vs production environments work.

## Overview

The Synq platform implements a multi-layered routing system that handles:

1. **Subdomain-based routing** (e.g., `admin.domain.com`, `vibesynq.domain.com`)
2. **Path-based routing** (e.g., `/apps/admin/`, `/apps/vibesynq/`)
3. **Static file serving** with proper MIME types and caching
4. **SPA fallback routing** for React applications
5. **Direct file access** for standalone content

## Current Architecture (Fixed)

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
**FIXED**: Now properly handles `/apps/` prefix structure:

```typescript
export const subdomainPlugin = new Elysia({ name: "subdomain" })
  .derive(({ request, set }) => {
    const url = new URL(request.url);
    const subdomain = extractSubdomain(url.hostname);
    return { subdomain, pathname: url.pathname };
  })
  // Static serving with correct /apps/ prefix
  .use(staticPlugin({
    assets: "./public/apps/admin",
    prefix: "/apps/admin",
    alwaysStatic: true
  }))
  // Root redirects to /apps/vibesynq/ (default app)
  .get("/", ({ redirect }) => redirect("/apps/vibesynq/"))
  // SPA fallback routes
  .get("/apps/admin/*", () => file("./public/apps/admin/index.html"));
```

### 2. Static File Serving (Fixed)

#### Production Build Outputs
**FIXED**: Each app now builds to the correct directory structure:

```
public/
├── apps/                   # ✅ FIXED: Proper /apps/ structure
│   ├── admin/              # Built admin React app
│   │   ├── index.html      # Entry point
│   │   ├── assets/         # JS, CSS, images
│   │   └── sw.js           # Service worker
│   ├── vibesynq/           # Built vibesynq React app
│   │   ├── index.html      # Entry point
│   │   ├── assets/         # JS, CSS, images
│   │   └── sw.js           # Service worker
│   ├── app1/               # ✅ FIXED: Placeholder apps
│   │   └── index.html      # "Coming Soon" page
│   └── app2/               # ✅ FIXED: Placeholder apps
│       └── index.html      # "Coming Soon" page
├── llm/                    # LLM service files
├── moto.html               # Standalone Three.js game
└── external-docs/          # Additional static content
```

#### Docker Build Process (Fixed)
**FIXED**: Dockerfile now properly creates the `/apps/` structure:

```dockerfile
# Create proper directory structure
RUN mkdir -p /app/public_final/apps/vibesynq && \
    mkdir -p /app/public_final/apps/admin && \
    mkdir -p /app/public_final/apps/app1 && \
    mkdir -p /app/public_final/apps/app2

# Copy built apps to correct locations
RUN cp -r /app/apps/vibesynq/dist/* /app/public_final/apps/vibesynq/
RUN cp -r /app/apps/admin/dist/* /app/public_final/apps/admin/

# Create placeholder files for missing apps
RUN echo '<html><head><title>App1</title></head><body><h1>App1 - Coming Soon</h1></body></html>' > /app/public_final/apps/app1/index.html
```

## Routing Rules & Examples (Updated)

### 1. Subdomain Routing

#### Admin Subdomain
**Pattern:** `admin.domain.com/*`
**Target:** Redirects to `/apps/admin/` path

```bash
# Examples
admin.localhost:3000/           → redirect to /apps/admin/
admin.localhost:3000/dashboard  → redirect to /apps/admin/dashboard
```

#### Vibesynq Subdomain
**Pattern:** `vibesynq.domain.com/*`
**Target:** Redirects to `/apps/vibesynq/` path

```bash
# Examples
vibesynq.localhost:3000/        → redirect to /apps/vibesynq/
vibesynq.localhost:3000/create  → redirect to /apps/vibesynq/create
```

### 2. Path-Based Routing (Primary)

#### Admin Path
**Pattern:** `domain.com/apps/admin/*`
**Target:** Serves admin React app with `/apps/admin/` base path

```bash
# Examples - ✅ WORKING
localhost:3000/apps/admin/           → public/apps/admin/index.html
localhost:3000/apps/admin/dashboard  → public/apps/admin/index.html (SPA routing)
localhost:3000/apps/admin/assets/    → public/apps/admin/assets/* (static assets)
```

#### Vibesynq Path
**Pattern:** `domain.com/apps/vibesynq/*`
**Target:** Serves vibesynq React app with `/apps/vibesynq/` base path

```bash
# Examples - ✅ WORKING
localhost:3000/apps/vibesynq/        → public/apps/vibesynq/index.html
localhost:3000/apps/vibesynq/create  → public/apps/vibesynq/index.html (SPA routing)
localhost:3000/apps/vibesynq/assets/ → public/apps/vibesynq/assets/* (static assets)
```

#### Root Redirect
**Pattern:** `domain.com/`
**Target:** Redirects to default app (`/apps/vibesynq/`)

```bash
# Examples - ✅ WORKING
localhost:3000/                      → 302 redirect to /apps/vibesynq/
```

### 3. Direct File Access

#### Root Level Files
**Pattern:** `domain.com/filename.ext`
**Target:** Direct file serving from `public/`

```bash
# Examples - ✅ WORKING
localhost:3000/moto.html        → public/moto.html
localhost:3000/multisynq-client.txt → public/multisynq-client.txt
```

## Development vs Production (Updated)

### Local Development

#### Vite Dev Servers
Each app runs its own Vite dev server during development:

```bash
# Vibesynq dev server - ✅ FIXED base path
cd apps/vibesynq && bunx vite
# Serves with base: "/apps/vibesynq/"

# Admin dev server - ✅ FIXED base path  
cd apps/admin && bunx vite
# Serves with base: "/apps/admin/"
```

#### Concurrent Development
Run all services simultaneously:

```bash
# All services - ✅ WORKING
bun run dev

# Individual services
bun run dev:vibesynq  # Server + Vibesynq
bun run dev:admin     # Server + Admin
```

### Production Build Process (Fixed)

#### 1. Build Phase
```bash
# Build all frontend apps - ✅ WORKING
bun run build:all
# apps/vibesynq/src → apps/vibesynq/dist/
# apps/admin/src/client → apps/admin/dist/

# Compile server - ✅ WORKING
bun run compile         # src/server → ./main
```

#### 2. Vite Build Configuration (Fixed)

**Vibesynq Build (`apps/vibesynq/vite.config.ts`):**
```typescript
// ✅ FIXED: Correct base path
export default defineConfig({
  root: resolve(__dirname, "src"),
  base: "/apps/vibesynq/",           // ✅ FIXED
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true
  }
});
```

**Admin Build (`apps/admin/vite.config.ts`):**
```typescript
// ✅ FIXED: Correct base path
export default defineConfig({
  root: resolve(__dirname, "src/client"),
  base: "/apps/admin/",              // ✅ FIXED
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true
  }
});
```

## Testing the Routing System (Updated)

### 1. Docker Testing (Recommended)

```bash
# Build Docker image - ✅ WORKING
bun docker:build

# Run container
docker run --rm -p 3001:3000 synq-chat

# Test all routes:
curl http://localhost:3001/                    # Should redirect to /apps/vibesynq/
curl http://localhost:3001/apps/admin/        # Should serve admin app
curl http://localhost:3001/apps/vibesynq/     # Should serve vibesynq app
curl http://localhost:3001/moto.html          # Should serve static file
curl http://localhost:3001/health             # Should return health status
```

### 2. Automated Testing

Use the provided test script:

```bash
# Run comprehensive tests
./test-routing.ps1
```

### 3. Manual Browser Testing

```bash
# Open in browser:
http://localhost:3001/apps/vibesynq/    # Should load React app
http://localhost:3001/apps/admin/      # Should load admin interface
http://localhost:3001/                 # Should redirect to vibesynq
```

## Configuration Files (Updated)

### Shared Config (`src/shared/config.ts`)
```typescript
// ✅ FIXED: Correct apps directory
const APPS_DIR = process.env.APPS_DIR ?? "./public/apps";

export const AVAILABLE_APPS = {
  admin: {
    name: "Admin",
    path: "admin",
    staticDir: `${APPS_DIR}/admin`,    // ✅ FIXED
    description: "Administrative interface"
  },
  vibesynq: {
    name: "VibeSynq", 
    path: "vibesynq",
    staticDir: `${APPS_DIR}/vibesynq`, // ✅ FIXED
    description: "AI app builder"
  }
};
```

## Current Status

### ✅ Fixed Issues:
1. **Path Structure**: All routes now use `/apps/` prefix consistently
2. **Docker Build**: Properly copies built files to correct locations
3. **Static Serving**: ElysiaJS static plugins serve from correct directories
4. **SPA Routing**: Fallback routes properly serve index.html for client-side routing
5. **Missing Directories**: Docker creates placeholder apps to prevent ENOENT errors
6. **Vite Base Paths**: Both apps build with correct base paths

### ✅ Working Features:
- Root redirect to default app (`/` → `/apps/vibesynq/`)
- App serving at `/apps/admin/` and `/apps/vibesynq/`
- Static file serving from root public directory
- Health check endpoint
- Docker containerization
- SPA fallback routing

### 🔄 Next Steps:
1. Test subdomain routing with proper DNS/hosts setup
2. Add more comprehensive error handling
3. Implement LLM subdomain functionality
4. Add monitoring and logging
5. Performance optimization

This routing system now provides a robust foundation for serving multiple applications with proper isolation, asset management, and development workflows. 
