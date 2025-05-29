import { AVAILABLE_APPS, Config } from "@shared/config";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { app } from "./index";

// Helper to create requests with specific host for subdomain testing
const createRequest = (path: string, host: string, options: RequestInit = {}): Request => {
	const url = `http://${host}${path}`;
	return new Request(url, {
		headers: { host, ...options.headers },
		...options
	});
};

const BASE_HOST = "localhost:3000";
const ADMIN_HOST = `admin.${BASE_HOST}`;
const VIBESYNQ_HOST = `vibesynq.${BASE_HOST}`;
const APP1_HOST = `app1.${BASE_HOST}`;
const APP2_HOST = `app2.${BASE_HOST}`;

describe("Elysia Server - Subdomain Routing & Static File Serving", () => {
	beforeAll(async () => {
		// Ensure test directories exist with test files
		for (const [key, appConfig] of Object.entries(AVAILABLE_APPS)) {
			if (!existsSync(appConfig.staticDir)) {
				await mkdir(appConfig.staticDir, { recursive: true });
			}

			// Create index.html if it doesn't exist
			const indexPath = `${appConfig.staticDir}/index.html`;
			if (!existsSync(indexPath)) {
				await writeFile(
					indexPath,
					`
<!DOCTYPE html>
<html>
<head><title>${appConfig.name} Test</title></head>
<body><h1>Test ${appConfig.name}</h1></body>
</html>`
				);
			}
		}
	});

	describe("Configuration & Setup", () => {
		it("should have correct app configuration", () => {
			expect(Config.DEFAULT_APP).toBe("vibesynq");
			expect(Config.APPS_DIR).toBe("./public");
			expect(Object.keys(AVAILABLE_APPS)).toContain("admin");
			expect(Object.keys(AVAILABLE_APPS)).toContain("vibesynq");
			expect(Object.keys(AVAILABLE_APPS)).toContain("app1");
			expect(Object.keys(AVAILABLE_APPS)).toContain("app2");
		});

		it("should have static directories for all apps", () => {
			for (const appConfig of Object.values(AVAILABLE_APPS)) {
				expect(existsSync(appConfig.staticDir)).toBe(true);
			}
		});
	});

	describe("MultiSynq Manual Routes", () => {
		it("GET /multisynq-react.txt should return the file", async () => {
			const request = createRequest("/multisynq-react.txt", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content.length).toBeGreaterThan(0);
		});

		it("GET /multisynq-js.txt should return the file", async () => {
			const request = createRequest("/multisynq-js.txt", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content.length).toBeGreaterThan(0);
		});

		it("GET /multisynq-threejs.txt should return multisynq-js.txt content", async () => {
			const request = createRequest("/multisynq-threejs.txt", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content.length).toBeGreaterThan(0);
		});
	});

	describe("Root Domain Routing", () => {
		it("GET / (base host) should redirect to default app", async () => {
			const request = createRequest("/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe(`/${Config.DEFAULT_APP}/`);
		});

		it("GET /health should return health status", async () => {
			const request = createRequest("/health", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.status).toBe("ok");
			expect(body.apps).toEqual(Object.keys(AVAILABLE_APPS));
			expect(body.timestamp).toBeDefined();
		});
	});

	describe("Subdomain-based App Routing", () => {
		it("Admin subdomain: GET / (admin.localhost) should redirect to /admin/", async () => {
			const request = createRequest("/", ADMIN_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/admin/");
		});

		it("Admin subdomain: GET /admin/ should serve admin app", async () => {
			const request = createRequest("/admin/", ADMIN_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("hello from bun!");
		});

		it("VibeSynq subdomain: GET / (vibesynq.localhost) should redirect to /vibesynq/", async () => {
			const request = createRequest("/", VIBESYNQ_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/vibesynq/");
		});

		it("VibeSynq subdomain: GET /vibesynq/ should serve vibesynq app", async () => {
			const request = createRequest("/vibesynq/", VIBESYNQ_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("Vibesynq App");
		});

		it("App1 subdomain: GET / (app1.localhost) should redirect to /app1/", async () => {
			const request = createRequest("/", APP1_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/app1/");
		});

		it("App1 subdomain: GET /app1/ should serve app1", async () => {
			const request = createRequest("/app1/", APP1_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("App1");
		});

		it("App2 subdomain: GET /app2/ should serve app2", async () => {
			const request = createRequest("/app2/", APP2_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("App2");
		});
	});

	describe("Path-based App Routing (without subdomain)", () => {
		it("GET /admin/ (base host) should serve admin app", async () => {
			const request = createRequest("/admin/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("hello from bun!");
		});

		it("GET /vibesynq/ (base host) should serve vibesynq app", async () => {
			const request = createRequest("/vibesynq/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("Vibesynq App");
		});

		it("GET /app1/ (base host) should serve app1", async () => {
			const request = createRequest("/app1/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("App1");
		});

		it("GET /app2/ (base host) should serve app2", async () => {
			const request = createRequest("/app2/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const content = await response.text();
			expect(content).toContain("App2");
		});
	});

	describe("VibeSynq AI API", () => {
		it("POST /api/ask-ai with missing prompt should return validation error", async () => {
			const request = createRequest("/api/ask-ai", BASE_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: "auto",
					ApiUrl: "http://localhost",
					Model: "test"
				})
			});

			const response = await app.handle(request);
			expect(response.status).toBe(400); // Our validation returns 400, not 422
		});

		it("POST /api/ask-ai with prompt but missing provider details should return error", async () => {
			const request = createRequest("/api/ask-ai", BASE_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: "Test prompt",
					provider: "local"
					// Missing ApiUrl and Model
				})
			});

			const response = await app.handle(request);
			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.ok).toBe(false);
			expect(body.message).toContain("Missing required fields");
		});
	});

	describe("Error Handling & Edge Cases", () => {
		it("Unknown subdomain should redirect to default app", async () => {
			const request = createRequest("/", "unknown.localhost:3000");
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe(`/${Config.DEFAULT_APP}/`);
		});

		it("Non-existent path should redirect appropriately", async () => {
			const request = createRequest("/non-existent-path", BASE_HOST);
			const response = await app.handle(request);
			// Should redirect to default app with the path
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe(
				`/${Config.DEFAULT_APP}/non-existent-path`
			);
		});

		it("Static file serving from public should work", async () => {
			// Note: /public/... URLs will be redirected by our subdomain plugin
			// so we test with a direct file that doesn't conflict
			const request = createRequest("/multisynq-js.txt", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
		});
	});

	describe("Cross-Origin & Security Headers", () => {
		it("should include appropriate headers", async () => {
			const request = createRequest("/health", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			// Check for security headers that might be set by rootPlugins
			expect(response.headers.get("x-content-type-options")).toBe("nosniff");
			expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
		});
	});

	afterAll(async () => {
		// Clean up test files if needed
		// Note: Be careful not to remove actual app files
		console.log("Tests completed");
	});
});
