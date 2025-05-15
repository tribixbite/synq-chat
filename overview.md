# Project Overview: Synq Multi-App Platform

## 1. Core Architecture

This project aims to create a monorepo web platform powered by **Bun** as the primary runtime for both the backend server and for building/serving multiple frontend applications. The backend is built using **ElysiaJS**, a fast and developer-friendly framework for Bun.

The platform will host several distinct applications:

*   **Backend Server (ElysiaJS):**
    *   Serves as the API hub for all frontend applications.
    *   Handles business logic, data persistence (details TBD), and AI interactions.
    *   Manages sub-domain routing and serves static assets for the frontend applications.
*   **Frontend Applications (initially React, with planned Svelte support):**
    *   **Admin App:** A React-based SPA for site management and internal company use. It will interact with secured backend APIs.
    *   **Vibesynq App:** The flagship application, a React-based AI app builder. Visitors can use this to create web applications, potentially leveraging libraries like Three.js and `react-together@latest`. It will feature real-time previews and dynamic app generation capabilities, heavily relying on backend AI APIs.
    *   **Future Sub-Apps:** The architecture should accommodate adding more frontend applications (e.g., a Svelte app) with relative ease.

## 2. Key Technologies & Tools

*   **Runtime & Bundling:**
    *   **Bun:** Used for running the ElysiaJS server, and as the package manager and bundler (via Vite) for frontend applications.
*   **Backend:**
    *   **ElysiaJS:** Core backend framework.
    *   **Eden Treaty:** Used for end-to-end type-safe API calls between the ElysiaJS backend and frontend clients.
*   **Frontend:**
    *   **Vite:** Primary build tool for frontend applications, configured for React and potentially Svelte.
    *   **React:** Initial framework for Admin and Vibesynq apps.
    *   **Svelte:** Planned for future applications.
    *   **Libraries:** Three.js, `react-together@latest` (for Vibesynq).
*   **Monorepo Management & Tooling:**
    *   **TypeScript:** For static typing across the entire codebase (backend and frontend).
    *   **Path Aliases (`tsconfig.json`):** Used for cleaner imports within the monorepo (e.g., `@shared`, `@helpers`, `@client`).
    *   **BiomeJS:** For linting and formatting, ensuring code quality and consistency.
    *   **Lefthook:** For managing Git hooks, likely to run Biome checks before commits.
*   **Deployment & CI/CD:**
    *   **Docker (`Dockerfile`):** Containerizes the application for deployment. The Dockerfile handles installing dependencies, building frontend applications, compiling the backend, and setting up the final production image.
    *   **Railway.app:** Target deployment platform, which will utilize the Dockerfile for its CI/CD pipeline.

## 3. Functionality Highlights

*   **Admin App:**
    *   User management (TBD).
    *   Content management (TBD).
    *   Analytics and monitoring (TBD).
    *   Secure access to administrative APIs.
*   **Vibesynq App (AI App Builder):**
    *   User interface for designing and configuring web applications.
    *   Interaction with backend AI services to generate code (HTML, CSS, JS) based on user prompts and configurations.
    *   Real-time preview of the generated applications.
    *   Support for integrating external libraries (e.g., Three.js, `react-together@latest`).
    *   Potential for user accounts, saving/loading projects (TBD).
*   **Backend Server:**
    *   Provides robust APIs for AI interactions (e.g., `/api/ask-ai` as seen in `vibesynq.ts`).
    *   Handles streaming responses for real-time code generation.
    *   Serves the static files for the Admin and Vibesynq (and future) applications.
    *   Manages subdomain routing (e.g., `admin.domain.com`, `vibesynq.domain.com`, `llm.domain.com` for specific LLM services if needed).

## 4. Current Structure & Status (Draft State)

*   **Monorepo Setup:** A Bun-based monorepo structure is in place with `apps/` for frontend applications and `src/` for server-side code and shared utilities.
*   **Backend (`src/server`):**
    *   `index.ts`: Main ElysiaJS server setup, including middleware, static file serving for different apps, and basic subdomain routing logic.
    *   `vibesynq.ts`: Contains ElysiaJS routes related to the Vibesynq app, notably the `/api/ask-ai` endpoint for AI interactions. This seems to be the most developed part of the backend logic so far.
    *   `admin.ts`: Placeholder or early draft for Admin app specific backend routes (currently not fully integrated into `index.ts` based on provided files).
    *   `helpers/`: Contains utility modules for the Elysia server (api, config, elysia lifecycle, plugins).
*   **Frontend Apps (`apps/`):
    *   `apps/admin/`: Contains a `tsconfig.json` for a React app.
    *   `apps/vibesynq/`: Contains a `tsconfig.json` for a React app. Frontend source code for these apps is not detailed but expected to reside in `apps/<app-name>/src/`.
*   **Shared Code (`src/shared/`):** Contains shared constants and potentially configuration (`config.ts`, `constants.ts`).
*   **Build & Configuration:**
    *   Root `tsconfig.json` for overall TypeScript settings and path aliases.
    *   App-specific `tsconfig.json` files for frontend apps.
    *   A root `vite.config.ts` is present, which seems to be intended for building a primary client application, but will need adaptation for a multi-app monorepo (likely separate Vite configs per app).
    *   `Dockerfile`: Defines the build and deployment process, including building frontend apps and compiling the Bun server.
    *   `.dockerignore`: Specifies files to exclude from the Docker build context.
*   **Tooling:** Biome and Lefthook are mentioned as part of the desired stack.

**Key Areas for Development:**

*   **Frontend Implementation:** Actual UI and logic for Admin and Vibesynq apps.
*   **Backend API Expansion:** Defining and implementing the full suite of APIs needed by the frontend apps, especially for Vibesynq's app building capabilities beyond the current `/api/ask-ai`.
*   **Data Persistence:** No database or data storage strategy is evident yet.
*   **Authentication/Authorization:** Needs to be designed and implemented for both Admin and potentially Vibesynq user projects.
*   **Vite Configuration for Multiple Apps:** The current single `vite.config.ts` will likely need to be refactored into per-app Vite configurations or a more sophisticated monorepo-aware Vite setup.
*   **Refinement of Server Logic:** The subdomain routing and overall structure in `src/server/index.ts` are functional but might need further refinement as features are added.
*   **Eden Treaty Integration:** While mentioned, the actual implementation of Eden Treaty for type-safe client-server communication needs to be integrated. 
