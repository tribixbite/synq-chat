# Project Overview: Synq Multi-App Platform

## 1. Core Architecture

This project is a **monorepo web platform** powered by **Bun** as the primary runtime for both the backend server and for building/serving multiple frontend applications. The backend is built using **ElysiaJS**, a fast and developer-friendly framework for Bun.

The platform hosts several distinct applications with sophisticated routing and static file serving:

*   **Backend Server (ElysiaJS):**
    *   Serves as the API hub for all frontend applications.
    *   Handles business logic, data persistence, and AI interactions.
    *   Manages sophisticated subdomain and path-based routing.
    *   Serves static assets for frontend applications with proper routing fallbacks.
*   **Frontend Applications (React-based):**
    *   **Admin App:** A React-based SPA for site management and internal company use at `/admin/` path.
    *   **Vibesynq App:** The flagship application, a React-based AI app builder at `/vibesynq/` path with Three.js integration.
    *   **Static Content:** Direct file serving for standalone content like `moto.html` (Three.js dirt bike simulator).
    *   **LLM Services:** Special subdomain routing for AI services at `llm.domain.com`.

## 2. Key Technologies & Tools

*   **Runtime & Bundling:**
    *   **Bun:** Used for running the ElysiaJS server, package management, and as the build runner for Vite.
*   **Backend:**
    *   **ElysiaJS:** Core backend framework with advanced static file serving.
    *   **Eden Treaty:** Ready for end-to-end type-safe API calls between backend and frontend.
*   **Frontend:**
    *   **Vite:** Build tool for frontend applications with optimized configurations.
    *   **React:** Framework for Admin and Vibesynq apps with React 19 and SWC.
    *   **Tailwind CSS:** Styling system for modern UI components.
    *   **Three.js:** 3D graphics library for interactive applications.
*   **Monorepo Management & Tooling:**
    *   **TypeScript:** Full type safety across backend and frontend with path aliases.
    *   **BiomeJS:** Linting and formatting for code quality.
    *   **Lefthook:** Git hooks for automated quality checks.
*   **Deployment & CI/CD:**
    *   **Docker:** Containerized deployment with multi-stage builds.
    *   **Railway.app/Fly.io:** Target deployment platforms.

## 3. Routing Architecture

The platform implements a sophisticated routing system that handles:

*   **Path-based routing:** `/admin/`, `/vibesynq/`, direct file access
*   **Subdomain routing:** `admin.domain.com`, `vibesynq.domain.com`, `llm.domain.com`
*   **Static asset serving:** Per-app asset bundles with correct base paths
*   **Fallback handling:** SPA routing with proper index.html serving

## 4. Current Implementation Status

### ✅ **Completed Infrastructure:**
*   **Monorepo Setup:** Fully functional Bun-based monorepo with proper workspace configuration.
*   **Build System:** Working Vite configurations for both apps with Tailwind CSS support.
*   **Backend Server (`src/server/`):**
    *   `index.ts`: Main ElysiaJS server with comprehensive static file serving.
    *   `plugins/subdomainPlugin.ts`: Advanced routing for subdomains and path-based apps.
    *   `plugins/vibesynqAiPlugin.ts`: AI interaction endpoints with streaming support.
    *   `helpers/`: Complete utility modules for server operations.
*   **Frontend Apps (`apps/`):**
    *   `apps/admin/`: React admin application with service worker support.
    *   `apps/vibesynq/`: React AI app builder with Three.js and Tailwind integration.
*   **Docker Deployment:** Production-ready Dockerfile with optimized builds.

### ✅ **Tested & Working:**
*   Local development with Vite dev servers
*   Production builds outputting to `public/` directories
*   Docker containerization with static file serving
*   Subdomain and path-based routing
*   Asset bundling and optimization

### 🔄 **In Progress:**
*   Frontend UI implementation (basic structure in place)
*   AI integration features (endpoints ready, UI needed)
*   Authentication system (infrastructure ready)

### 📋 **Next Phase:**
*   User interface development for both apps
*   Database integration for data persistence
*   Advanced AI features and streaming UI
*   User authentication and authorization

## 5. File Structure & Output Mapping

```
Project Root
├── apps/
│   ├── admin/src/          → builds to → public/admin/
│   └── vibesynq/src/       → builds to → public/vibesynq/
├── public/                 → served directly by ElysiaJS
│   ├── admin/             (built admin app)
│   ├── vibesynq/          (built vibesynq app)
│   ├── llm/               (LLM service files)
│   ├── moto.html          (standalone Three.js game)
│   └── ...                (other static content)
└── src/server/            → compiles to → ./main (Docker executable)
```

The routing system ensures that:
- `/admin/` serves the built admin SPA
- `/vibesynq/` serves the built vibesynq SPA  
- `/moto.html` serves the standalone game
- Subdomains route to appropriate apps
- Assets are served with correct MIME types and caching

This architecture provides a robust foundation for a multi-application platform with professional-grade routing and deployment capabilities.
