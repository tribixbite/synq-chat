# Project Roadmap: Synq Multi-App Platform

This document outlines the development steps to achieve the desired end state for the platform. Items are categorized and marked with their status.

**Status Legend:**

*   `[ ]` To Do
*   `[/]` Partially Complete
*   `[x]` Complete

## Phase 1: Core Infrastructure & Setup

*   **Monorepo & Bun Setup:**
    *   `[x]` Initialize Bun project.
    *   `[x]` Establish basic directory structure (`apps/`, `src/`, `shared/`).
    *   `[x]` Configure root `package.json` for workspace commands (TBD in more detail).
*   **TypeScript Configuration:**
    *   `[x]` Create root `tsconfig.json` with base settings and path aliases.
    *   `[x]` Create `tsconfig.json` for Admin app (React).
    *   `[x]` Create `tsconfig.json` for Vibesynq app (React).
    *   `[ ]` Create `tsconfig.json` for future Svelte app template.
*   **Backend Server (ElysiaJS) - Initial Setup:**
    *   `[x]` Basic ElysiaJS server (`src/server/index.ts`).
    *   `[/]` Static file serving for frontend apps (Admin, Vibesynq).
    *   `[/]` Basic subdomain routing logic.
    *   `[x]` Initial helper modules (`@helpers/*`).
    *   `[x]` Placeholder for shared config (`@shared/config`).
*   **Vite Configuration (Initial - Needs Refactor):**
    *   `[/]` Root `vite.config.ts` present (currently seems to target a single app).
    *   `[ ]` Refactor Vite setup for multiple individual frontend apps (e.g., `apps/admin/vite.config.ts`, `apps/vibesynq/vite.config.ts`).
    *   `[ ]` Ensure each app Vite config outputs build to `public/` sub-directory (e.g., `apps/admin/public/`) to align with Dockerfile and Elysia server.
    *   `[ ]` Ensure each app can be built independently by Vite.
*   **Docker & Deployment:**
    *   `[/]` `Dockerfile` created for building and deploying (builds `vibesynq` and `admin`).
    *   `[x]` `.dockerignore` configured.
    *   `[ ]` Test deployment to Railway.app with the current Docker setup.
*   **Tooling:**
    *   `[ ]` Fully integrate BiomeJS (linting, formatting) with `package.json` scripts.
    *   `[ ]` Configure Lefthook to run Biome checks on pre-commit.
    *   `[x]` Biome config file (`biome.json`) exists.
    *   `[x]` Lefthook config files (`lefthook.json`, `lefthook.ts`) exist.

## Phase 2: Admin Application (React)

*   `[ ]` Define core features and UI/UX for site management.
*   `[ ]` Develop React components and structure within `apps/admin/src/`.
*   `[ ]` Implement API client (using Eden Treaty) for Admin-specific backend endpoints.
*   `[ ]` Develop backend APIs for Admin functionalities (e.g., user management, content controls).
*   `[ ]` Implement authentication and authorization for Admin routes and APIs.
*   `[ ]` Style the application (e.g., using a UI library or custom CSS).
*   `[ ]` Unit and integration tests.

## Phase 3: Vibesynq Application (React AI App Builder)

*   **Core AI Interaction:**
    *   `[/]` Backend API endpoint `/api/ask-ai` for code generation (streaming implemented in `src/server/vibesynq.ts`).
    *   `[ ]` Frontend UI for submitting prompts and parameters to the AI.
    *   `[ ]` Frontend logic to handle streaming AI responses and display generated code/previews.
*   **App Building UI/UX:**
    *   `[ ]` Design and implement the user interface for creating/configuring web apps.
    *   `[ ]` Develop components for managing app structure, styling, and logic inputs.
*   **Library Integration:**
    *   `[ ]` Mechanism for users to specify and include libraries like Three.js, `react-together@latest` in their generated apps.
    *   `[ ]` Backend support for incorporating these libraries into the generated code.
*   **Real-time Preview:**
    *   `[ ]` Frontend component to render the generated HTML/CSS/JS in a sandboxed environment (e.g., iframe).
*   **Advanced Features (Future):**
    *   `[ ]` User accounts for Vibesynq (saving/loading projects).
    *   `[ ]` More sophisticated AI models or fine-tuning options.
    *   `[ ]` Templates or pre-built components.
*   **Eden Treaty Integration:**
    *   `[ ]` Implement Eden Treaty for type-safe API calls to all Vibesynq backend endpoints.
*   **Styling & Testing:**
    *   `[ ]` Style the application.
    *   `[ ]` Unit and integration tests.

## Phase 4: Backend Enhancements & Refinements

*   `[ ]` **Data Persistence:**
    *   `[ ]` Choose and integrate a database (e.g., PostgreSQL, SQLite, SurrealDB).
    *   `[ ]` Define schemas and models for users, projects, app configurations, etc.
*   `[ ]` **Robust Authentication & Authorization:**
    *   `[ ]` Implement a secure auth system (e.g., JWT, session-based) for all relevant parts of the platform.
*   `[ ]` **API Expansion & Security:**
    *   `[ ]` Develop all necessary APIs for Admin and Vibesynq features.
    *   `[ ]` Implement input validation, rate limiting, and other security best practices for all APIs.
*   `[ ]` **Configuration Management:**
    *   `[/]` Use shared config (`@shared/config`), refine for production (env variables).
*   `[ ]` **Logging & Monitoring:**
    *   `[ ]` Implement comprehensive logging.
    *   `[ ]` Set up monitoring and error tracking (e.g., Sentry, OpenTelemetry if not already fully done).
*   `[ ]` **Refine Subdomain & LLM Service Logic:**
    *   `[/]` Current `llmApp` in `vibesynq.ts` for potential direct LLM proxying needs review and integration.
    *   `[/]` Ensure subdomain routing in `src/server/index.ts` is robust and scalable.

## Phase 5: Svelte Sub-App (Example of Multi-Framework)

*   `[ ]` Create `apps/svelte-app/` directory.
*   `[ ]` Add `apps/svelte-app/tsconfig.json` (extending root, Svelte specific options).
*   `[ ]` Add `apps/svelte-app/vite.config.ts` with Svelte plugin.
*   `[ ]` Develop a simple Svelte application.
*   `[ ]` Configure ElysiaJS server to serve the Svelte app (static files, routing).
*   `[ ]` Add build script for the Svelte app to `package.json` and `Dockerfile`.

## Phase 6: Deployment & Operations

*   `[ ]` Thoroughly test the Docker build process locally.
*   `[ ]` Set up CI/CD on Railway.app to auto-deploy from the main branch.
*   `[ ]` Configure environment variables and secrets on Railway.
*   `[ ]` Set up custom domains.
*   `[ ]` Monitor application performance and stability post-deployment.

## Continuous Tasks

*   `[ ]` **Documentation:** Keep `overview.md`, `todo.md`, and other necessary documentation up-to-date.
*   `[ ]` **Code Quality:** Regularly run Biome for linting/formatting.
*   `[ ]` **Dependency Management:** Keep dependencies updated (Bun, Elysia, Vite, React, etc.).
*   `[ ]` **Testing:** Write and maintain unit, integration, and potentially E2E tests. 
