# VibeSynq Implementation & Testing Guide (V5 - Automation & Verification)

This document is the definitive, step-by-step guide for the VibeSynq application overhaul. Each phase contains tasks with explicit instructions for research (MCP queries) and verification (automated testing). An LLM should execute each numbered item and its corresponding test as a single, atomic unit of work.

---

### 0. Phase 0: Foundational Setup

**Objective:** Prepare the development environment with proper configuration management, automated UI testing, and a unified testing command.

* **0.1. Task: Environment Configuration**
    * **MCP Context Query:** "Best practices for managing environment variables in a Bun project."
    * **Action:** Create a `.env.example` file in the root directory with `JWT_SECRET` and `CHUTES_AI_KEY` placeholders. Add `.env` to `.gitignore`.

* **0.2. Task: Automated Testing Setup**
    * **MCP Context Query:** "How to set up Playwright for a Bun project with React/Vite."
    * **Action:** Run `bunx playwright install` to add Playwright and install its browser dependencies.
    * **Action:** In `package.json`, modify the `"test"` script to `"test": "bun test"` and add `"test:e2e": "bunx playwright test"`. Create a `playwright.config.ts` file in the root directory.

* **0.3. Test: Manual Verification**
    * **Action:** Create a `.env` file. Run `bun test` (should find no tests). Run `bun test:e2e` (should report no tests found). This confirms the runners are configured correctly.

---

### 1. Phase 1: Backend Restructuring & Scaffolding

**Objective:** Establish the new, modular backend directory structure.

* **1.1. Task: Create Directories and Scaffold Files**
    * **MCP Context Query:** "Bun File System API for creating directories and files (`mkdir`, `writeFile`)."
    * **Action:** Create `src/server/services/` and scaffold `llmProviderService.ts`, `renderService.ts`, and `persistenceService.ts`. Create `src/server/plugins/persistencePlugin.ts` with placeholder content.

* **1.2. Test: Verify Directory and File Structure**
    * **Action:** Create `src/server/tests/01-structure.test.ts` to verify the existence of the new directories and files. Run `bun test`; it should pass.

---

### 2. Phase 2: Core Backend Implementation

**Objective:** Implement the `llmProviderService` and refactor the AI endpoint to use a structured, tool-centric format.

* **2.1. Task: Implement LLM Provider Service & Refactor AI Endpoint**
    * **MCP Context Query:** "ElysiaJS request lifecycle and context", "JavaScript Fetch API POST request example", "Claude 3.5 Sonnet API reference", "chutes.ai R1 model API reference".
    * **Action:** Implement the full logic in `llmProviderService.ts` to handle API key routing and `fetch` calls. Rename `vibesynqAiPlugin.ts` to `aiEditPlugin.ts`, refactor the endpoint to `POST /api/ai/edit`, and implement the "tool use" logic to construct specific prompts and patch the code. Update `src/server/index.ts` to use it.

* **2.2. Test: Verify AI Endpoint and Service Logic**
    * **Action:** Create `src/server/tests/02-ai.test.ts` which mocks `llmProviderService` and tests that a call to `/api/ai/edit` constructs the correct system prompt. Run `bun test`; it should pass.

---

### 3. Phase 3: Frontend Overhaul

**Objective:** Decouple frontend state, introduce file management, and modernize AI/preview logic with autosaving.

* **3.1. Task: Implement Frontend Changes**
    * **MCP Context Query:** "Monaco Editor React component API", "`react-use` debounce hook example", "Browser File API FileReader", "ElysiaJS routing params".
    * **Action:** Refactor `App.tsx` to make the Monaco Editor the source of truth and add a debounced autosave. Add a "File" menu to `header.tsx`. Rename `deploy-button.tsx` to `FileActions.tsx` and implement upload/download. In `ask-ai.tsx`, refactor `callAi` to send a structured request. In `preview.tsx`, remove `srcDoc` and implement the `/api/render/preview` flow. Create `src/server/plugins/renderPlugin.ts` to handle this.

* **3.2. Test: E2E Verification with Playwright**
    * **Action:** Create `tests/e2e/phase3.spec.ts`.
    * **Content:**
        ```typescript
        // tests/e2e/phase3.spec.ts
        import { test, expect } from '@playwright/test';

        test.describe('Phase 3: Frontend Overhaul', () => {
          test.beforeEach(async ({ page }) => {
            await page.goto('/apps/vibesynq'); // Assuming this is the editor's URL
          });

          test('should have a File menu and autosave on editor change', async ({ page }) => {
            await page.getByRole('button', { name: 'File' }).click();
            await expect(page.getByRole('button', { name: 'Upload File' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Download Code' })).toBeVisible();

            // Intercept the autosave request
            const saveRequestPromise = page.waitForRequest(req => req.url().includes('/api/apps/update/'));
            
            // Type into the Monaco editor
            await page.locator('.monaco-editor').click();
            await page.keyboard.type('<!-- A new comment -->');
            
            const saveRequest = await saveRequestPromise;
            expect(saveRequest.method()).toBe('POST'); // Or PUT
          });

          test('AI edit should send a structured request', async ({ page }) => {
              const editRequestPromise = page.waitForRequest(req => req.url().includes('/api/ai/edit') && req.method() === 'POST');
              
              await page.getByPlaceholder(/Ask AI anything/).fill('change h1 to blue');
              await page.getByRole('button', { name: 'Send' }).click();

              const editRequest = await editRequestPromise;
              const payload = await editRequest.postDataJSON();
              expect(payload.action).toBe('update-css'); // or similar logic
              expect(payload.selector).toBe('h1');
          });

          test('Preview iframe should not use srcdoc', async ({ page }) => {
            const iframe = page.frameLocator('iframe[title="output"]');
            await expect(iframe.locator('body')).toBeVisible(); // Make sure it loaded something
            const srcDoc = await page.locator('iframe[title="output"]').getAttribute('srcdoc');
            expect(srcDoc).toBeNull();
          });
        });
        ```
    * **Action:** Run `bun test:e2e`. It should pass.

---

### 4. Phase 4: Authentication & App Management

**Objective:** Integrate JWT authentication, provide user-scoped app management, and harden persistence.

* **4.1. Task: Implement Authentication & App Management**
    * **MCP Context Query:** "`@elysiajs/jwt` setup and usage", "ElysiaJS middleware", "Best way to sanitize file path inputs in Bun".
    * **Action:** Run `bun add @elysiajs/jwt`. Create `authPlugin.ts` with `/login`, `/profile` endpoints.
    * **Action:** In `persistenceService.ts`, modify functions to require a `userId`, add `listApps` and `deleteApp`, and sanitize all path inputs.
    * **Action:** In `persistencePlugin.ts`, protect routes with JWT and create `GET /list`, `GET /:appId`, and `DELETE /:appId` endpoints.
    * **Action:** In the frontend `login.tsx`, implement a form that calls `/api/auth/login` and stores the JWT.

* **4.2. Test: Backend and E2E Verification**
    * **Backend Test:** Create `src/server/tests/04-auth.test.ts` to verify JWT creation and that protected endpoints return 401 without a token and 200 with one. Run `bun test`; it should pass.
    * **E2E Test:** Create `tests/e2e/phase4.spec.ts`.
    * **Content:**
        ```typescript
        // tests/e2e/phase4.spec.ts
        import { test, expect } from '@playwright/test';

        test('should be able to log in and see the app gallery', async ({ page }) => {
            await page.goto('/apps'); // Go to the main gallery
            // Assuming a login redirect or modal appears
            await page.getByPlaceholder('Username').fill('testuser');
            await page.getByPlaceholder('Password').fill('password');
            await page.getByRole('button', { name: 'Login' }).click();

            // Check for successful login state
            await expect(page.locator('h2', { hasText: 'My Projects' })).toBeVisible();

            // Verify a token is in localStorage
            const token = await page.evaluate(() => localStorage.getItem('jwt'));
            expect(token).toBeTruthy();
        });
        ```
    * **Action:** Run `bun test:e2e`. It should pass.

---

### 5. Phase 5: Advanced AI & Production Readiness

**Objective:** Implement context window management and add production-level error handling.

* **5.1. Task: Implement Context Management and Hardening**
    * **MCP Context Query:** "Using JavaScript Map for an in-memory cache with TTL", "ElysiaJS global error handling", "React Context API for sharing state".
    * **Action:** Create `contextCacheService.ts` and the `contextPlugin.ts` with a protected `POST /api/ai/context` endpoint. Modify `llmProviderService.ts` to fetch and prepend cached context. In the frontend `settings.tsx`, add UI for "Custom Instructions" and the Anthropic API key. In `src/server/index.ts`, wrap service calls in `try...catch` blocks.

* **5.2. Test: Backend and E2E Verification**
    * **Backend Test:** Create `src/server/tests/05-context.test.ts` to verify `POST /api/ai/context` calls the cache service correctly. Run `bun test`; it should pass.
    * **E2E Test:** Create `tests/e2e/phase5.spec.ts`.
    * **Content:**
        ```typescript
        // tests/e2e/phase5.spec.ts
        import { test, expect } from '@playwright/test';

        test('should allow setting custom instructions', async ({ page, context }) => {
            // Pre-authenticate by setting the JWT in storage state
            await context.addCookies([{ name: 'auth_token', value: 'dummy-jwt-for-testing', domain: 'localhost', path: '/' }]);
            await page.goto('/apps/vibesynq');
            
            const contextRequestPromise = page.waitForRequest(req => req.url().includes('/api/ai/context'));

            await page.getByRole('button', { name: 'Settings' }).click();
            await page.getByPlaceholder('Custom Instructions...').fill('Always use semantic HTML5 tags.');
            await page.getByRole('button', { name: 'Save Settings' }).click(); // Assuming a save button

            const contextRequest = await contextRequestPromise;
            const payload = await contextRequest.postDataJSON();
            expect(payload.context).toBe('Always use semantic HTML5 tags.');
        });
        ```
    * **Action:** Run `bun test:e2e`. It should pass.

---

### 6. Phase 6: The Unified App Platform

**Objective:** Integrate the `gallery` and `vibesynq` into a single, cohesive user experience with a "delightful, whimsical, and sophisticated" UI.

* **6.1. Task: Unify Gallery and Implement Create Flow**
    * **MCP Context Query:** "React Router `useParams` and `useSearchParams`", "CSS `perspective` and `transform: rotateY()`", "`lucide-react` icon library usage".
    * **Action:** In `apps/gallery/src/AppGallery.tsx`, refactor to fetch user projects from `/api/apps/list` and display them alongside showcase templates. Add a "Create New App" button and modal flow.
    * **Action:** Update the `vibesynq` app to handle `/edit/:appId` and `/new?template=...` routes for loading existing apps or new templates.
    * **Action:** In `apps/gallery/src/index.css`, add the specified whimsical CSS for card hovers and buttons. Replace emoji with `lucide-react` icons.

* **6.2. Test: E2E Verification of the Full User Journey**
    * **Action:** Create `tests/e2e/phase6.spec.ts`.
    * **Content:**
        ```typescript
        // tests/e2e/phase6.spec.ts
        import { test, expect } from '@playwright/test';
        
        test.describe('Phase 6: Unified Platform Flow', () => {
          test.beforeEach(async ({ page, context }) => {
            // Pre-authenticate for all tests in this suite
            await context.addCookies([{ name: 'auth_token', value: 'dummy-jwt-for-testing', domain: 'localhost', path: '/' }]);
            await page.goto('/apps');
          });

          test('should display gallery sections and allow app creation', async ({ page }) => {
            await expect(page.locator('h2', { hasText: 'My Projects' })).toBeVisible();
            await expect(page.locator('h2', { hasText: 'Showcase Templates' })).toBeVisible();

            await page.getByRole('button', { name: 'Create New App' }).click();
            await page.getByRole('button', { name: 'Blank TSX' }).click();

            await expect(page).toHaveURL(/.*\/vibesynq\/new\?template=tsx/);
            await expect(page.locator('.monaco-editor')).toContainText('React');
          });

          test('should list, edit, and delete a created app', async ({ page }) => {
            // This is a full flow test
            // 1. Create a new app
            await page.getByRole('button', { name: 'Create New App' }).click();
            await page.getByRole('button', { name: 'Blank HTML' }).click();
            await page.waitForURL(/.*\/vibesynq\/edit\/.*/); // Wait for redirect after creation/save
            
            // 2. Go back to gallery and verify it's listed
            await page.goto('/apps');
            const projectCard = page.locator('.project-card').first(); // Assuming a class for user projects
            await expect(projectCard).toBeVisible();

            // 3. Verify whimsical hover effect (via CSS property check)
            await projectCard.hover();
            await expect(projectCard).toHaveCSS('transform', /perspective/);

            // 4. Delete the project
            const deleteRequestPromise = page.waitForRequest(req => req.method() === 'DELETE');
            await projectCard.getByRole('button', { name: 'Delete' }).click();
            await page.getByRole('button', { name: 'Confirm Delete' }).click(); // Assuming a confirm dialog
            await deleteRequestPromise;
            
            await expect(projectCard).not.toBeVisible();
          });
        });
        ```
    * **Action:** Run `bun test:e2e`. It should pass.
