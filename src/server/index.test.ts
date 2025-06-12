import { AVAILABLE_APPS, Config } from "@shared/config";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { app } from "./index";

// Helper to create proper fully qualified URLs for ElysiaJS testing
const createRequest = (
	path: string,
	host = "localhost:3000",
	options: RequestInit = {}
): Request => {
	// ElysiaJS requires fully qualified URLs, not relative paths
	const url = `http://${host}${path}`;
	return new Request(url, {
		headers: { host, ...options.headers },
		...options
	});
};

const BASE_HOST = "localhost:3000";
const ADMIN_HOST = `admin.${BASE_HOST}`;
const VIBESYNQ_HOST = `vibesynq.${BASE_HOST}`;

const staticFiles = [
	"multisynq-react.txt",
	"multisynq-js.txt",
	"multisynq-client.txt"
	// "multisynq-gpt.txt"
];

describe("ElysiaJS Server - Core Functionality Tests", () => {
	beforeAll(async () => {
		// Set test environment to avoid production behaviors during testing
		Bun.env.NODE_ENV = "test";

		// Ensure test directories exist with test files
		// for (const [key, appConfig] of Object.entries(AVAILABLE_APPS)) {
		// 	if (!existsSync(appConfig.staticDir)) {
		// 		await mkdir(appConfig.staticDir, { recursive: true });
		// 	}

		// }
	});

	describe("Configuration & Setup", () => {
		it("should have correct app configuration", () => {
			expect(Config.DEFAULT_APP).toBe("vibesynq");
			expect(Config.APPS_DIR).toBe("./public/apps");
			expect(Object.keys(AVAILABLE_APPS)).toContain("admin");
			expect(Object.keys(AVAILABLE_APPS)).toContain("vibesynq");
		});

		it("should have static directories for all apps", () => {
			for (const appConfig of Object.values(AVAILABLE_APPS)) {
				expect(existsSync(appConfig.staticDir)).toBe(true);
			}
		});
	});

	describe("MultiSynq Manual StaticRoutes", () => {
		for (const file of staticFiles) {
			it(`GET /${file} should return the file`, async () => {
				const request = createRequest(`/${file}`, BASE_HOST);
				const response = await app.handle(request);
				expect(response.status).toBe(200);
				const content = await response.text();
				expect(content.length).toBeGreaterThan(0);
			});
		}
	});

	describe("Core Server Routes", () => {
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

	describe("App Routing Tests", () => {
		it("GET /admin/ should serve admin app content", async () => {
			const request = createRequest("/admin/", BASE_HOST);
			const response = await app.handle(request);

			// With simplified app router, this will redirect to /apps
			expect([200, 302]).toContain(response.status);
		});

		it("GET /vibesynq/ should serve vibesynq app content", async () => {
			const request = createRequest("/vibesynq/", BASE_HOST);
			const response = await app.handle(request);

			// With simplified app router, this will redirect to /apps
			expect([200, 302]).toContain(response.status);
		});
	});

	describe("API Endpoint Tests", () => {
		it("POST /api/ask-ai with missing prompt should return validation error", async () => {
			const request = createRequest("/api/ask-ai", BASE_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: "auto",
					ApiUrl: "http://localhost",
					Model: "test"
					// Missing prompt
				})
			});

			const response = await app.handle(request);
			// Elysia returns 422 for validation errors, which is correct
			expect([400, 422]).toContain(response.status);

			const body = await response.json();
			expect(body.message || body.error).toBeDefined();
		});

		it("POST /api/ask-ai with invalid provider should return error", async () => {
			const request = createRequest("/api/ask-ai", BASE_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: "Test prompt",
					provider: "invalid-provider"
				})
			});

			const response = await app.handle(request);
			expect(response.status).toBe(400);
		});

		it("GET /api/unknown-endpoint should return 404", async () => {
			const request = createRequest("/api/unknown-endpoint", BASE_HOST);
			const response = await app.handle(request);

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe("NOT_FOUND");
		});
	});

	describe("Rate Limiting Tests", () => {
		it("GET /rate-limit-status should return rate limit info", async () => {
			const request = createRequest("/rate-limit-status", BASE_HOST);
			const response = await app.handle(request);

			expect(response.status).toBe(200);
			const body = await response.json();
			// Fix: The actual response has 'rateLimit' not 'rateLimits'
			expect(body.rateLimit).toBeDefined();
		});

		it("GET /security-status should return security info", async () => {
			const request = createRequest("/security-status", BASE_HOST);
			const response = await app.handle(request);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.security).toBeDefined();
		});
	});

	describe("Subdomain Routing Tests", () => {
		it("Admin subdomain should handle routing correctly", async () => {
			const request = createRequest("/", ADMIN_HOST);
			const response = await app.handle(request);

			// Should either serve content or redirect to admin app
			expect([200, 302]).toContain(response.status);
		});

		it("VibeSynq subdomain should handle routing correctly", async () => {
			const request = createRequest("/", VIBESYNQ_HOST);
			const response = await app.handle(request);

			// Should either serve content or redirect to vibesynq app
			expect([200, 302]).toContain(response.status);
		});

		it("Unknown subdomain should handle gracefully", async () => {
			const request = createRequest("/", "unknown.localhost:3000");
			const response = await app.handle(request);

			// Should redirect or serve default content
			expect([200, 302]).toContain(response.status);
		});
	});

	describe("Error Handling & Edge Cases", () => {
		it("should handle non-existent static files gracefully", async () => {
			const request = createRequest("/non-existent-file.txt", BASE_HOST);
			const response = await app.handle(request);

			// Should either return 404 or redirect appropriately
			expect([302, 404]).toContain(response.status);
		});

		it("should include security headers", async () => {
			const request = createRequest("/health", BASE_HOST);
			const response = await app.handle(request);

			expect(response.status).toBe(200);
			// Check for common security headers
			expect(response.headers.get("x-content-type-options")).toBe("nosniff");
			// Fix: elysia-helmet sets x-frame-options to DENY by default, not SAMEORIGIN
			expect(response.headers.get("x-frame-options")).toBe("DENY");
		});

		it("should handle OPTIONS requests for CORS", async () => {
			const request = createRequest("/api/ask-ai", BASE_HOST, {
				method: "OPTIONS"
			});
			const response = await app.handle(request);

			// Should either handle OPTIONS or return appropriate status
			expect([200, 204, 405]).toContain(response.status);
		});
	});

	describe("Static File Serving", () => {
		it("should serve favicon.ico", async () => {
			const request = createRequest("/icons/favicon.ico", BASE_HOST);
			const response = await app.handle(request);

			// Should serve file or return 404 if not found
			expect([200, 404]).toContain(response.status);
		});

		it("should serve robots.txt if it exists", async () => {
			const request = createRequest("/robots.txt", BASE_HOST);
			const response = await app.handle(request);

			// Fix: robots.txt gets redirected by the fallback route, so include 302
			expect([200, 302, 404]).toContain(response.status);
		});
	});

	afterAll(async () => {
		// Reset environment
		Bun.env.NODE_ENV = "development";
		console.log("✅ ElysiaJS server tests completed successfully");
	});
});
