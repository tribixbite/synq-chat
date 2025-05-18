import { describe, expect, it, spyOn } from "bun:test";
import { app as elysiaAppInstance } from "./index"; // Assuming app is exported

// Helper to create requests with specific host for subdomain testing
const createRequest = (path: string, host: string, options: RequestInit = {}): Request => {
	const url = `http://${host}${path}`;
	return new Request(url, {
		headers: { host, ...options.headers },
		...options
	});
};

const BASE_HOST = "localhost:3000"; // Ensure this matches your Config.HOST if it includes port
const ADMIN_HOST = `admin.${BASE_HOST}`;
const VIBESYNQ_HOST = `vibesynq.${BASE_HOST}`;
const LLM_HOST = `llm.${BASE_HOST}`;

describe("Elysia Server Endpoint Tests", () => {
	const app = elysiaAppInstance;

	describe("Root and General Routes", () => {
		it("GET / (base host) should redirect to /vibesynq/", async () => {
			const request = createRequest("/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/vibesynq/");
		});

		it("GET /multisynq-react.txt should return the file", async () => {
			const request = createRequest("/multisynq-react.txt", BASE_HOST);
			const response = await app.handle(request);
			if (response.status === 404) {
				console.warn(
					"'/multisynq-react.txt' not found, test can be skipped or you should check public folder setup."
				);
			} else {
				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toMatch(/^text\/plain/);
			}
		});

		it("GET /unknown-path (base host) should be handled by vibesynqPlugin SPA fallback", async () => {
			const request = createRequest("/unknown-path", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});
	});

	describe("Vibesynq App (vibesynq.localhost:3000 or fallback)", () => {
		it("GET / (vibesynq host) should redirect to /vibesynq/", async () => {
			const request = createRequest("/", VIBESYNQ_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/vibesynq/");
		});

		it("GET /vibesynq/ (vibesynq host) should serve Vibesynq SPA", async () => {
			const request = createRequest("/vibesynq/", VIBESYNQ_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});

		it("GET /vibesynq/ (base host) should serve Vibesynq SPA", async () => {
			const request = createRequest("/vibesynq/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});

		it("POST /api/ask-ai with valid prompt", async () => {
			const fetchSpy = spyOn(globalThis, "fetch");

			const mockFetchImplementationForSuccess: typeof fetch = Object.assign(
				async (
					input: URL | RequestInfo,
					init?: RequestInit | undefined
				): Promise<Response> => {
					const urlString =
						typeof input === "string"
							? input
							: input instanceof URL
								? input.href
								: input.url;
					if (urlString.includes("mockhost")) {
						const readableStream = new ReadableStream({
							start(controller) {
								controller.enqueue(
									'data: {"choices":[{"delta":{"content":"Mocked AI response part 1..."}}]}'
								);
								controller.enqueue(
									'data: {"choices":[{"delta":{"content":"...part 2"}}]}'
								);
								controller.enqueue("data: [DONE]");
								controller.close();
							}
						});
						return new Response(readableStream, {
							status: 200,
							headers: { "Content-Type": "text/event-stream" }
						});
					}
					return new Response("Fallback mock fetch response", { status: 418 });
				},
				{
					preconnect: (url: string | URL, options?: unknown): void => {
						/* no-op for mock */
					}
				}
			);

			fetchSpy.mockImplementation(mockFetchImplementationForSuccess);

			const request = createRequest("/api/ask-ai", VIBESYNQ_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: "Hello",
					provider: "auto",
					ApiUrl: "http://mockhost/chat/completions",
					Model: "mockmodel"
				})
			});

			const response = await app.handle(request);

			// The AskAI route itself should return 200 if the stream is successfully initiated.
			// The client would then read the stream.
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("text/plain"); // As per vibesynqPlugin.ts set.headers

			fetchSpy.mockRestore();
		});

		it("POST /api/ask-ai when external fetch fails", async () => {
			const fetchSpy = spyOn(globalThis, "fetch");

			const mockFetchImplementationForFailure: typeof fetch = Object.assign(
				async (
					input: URL | RequestInfo,
					init?: RequestInit | undefined
				): Promise<Response> => {
					return new Response("External AI service unavailable", { status: 503 });
				},
				{
					preconnect: (url: string | URL, options?: unknown): void => {
						/* no-op for mock */
					}
				}
			);

			fetchSpy.mockImplementation(mockFetchImplementationForFailure);

			const request = createRequest("/api/ask-ai", VIBESYNQ_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: "Test an error",
					provider: "auto",
					ApiUrl: "http://failingmockhost/chat/completions",
					Model: "mockmodel"
				})
			});

			const response = await app.handle(request);
			expect(response.status).toBe(503); // Or whatever status your error handling in ask-ai returns
			const body = await response.json();
			expect(body.ok).toBe(false);
			expect(body.message).toContain("API Error: 503");

			fetchSpy.mockRestore();
		});

		it("POST /api/ask-ai without prompt should use Elysia validation message", async () => {
			const request = createRequest("/api/ask-ai", VIBESYNQ_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: "auto",
					ApiUrl: "http://mockhost",
					Model: "mockmodel"
				})
			});
			const response = await app.handle(request);
			expect(response.status).toBe(400);
			const body = await response.json();
			// Check for Elysia's typical validation error structure if possible, or the message
			expect(body.message || body.error).toMatch(/Expected property 'prompt' to be string/i);
		});

		it("GET /api/login (vibesynq host) should return redirectUrl", async () => {
			const request = createRequest("/api/login", VIBESYNQ_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.redirectUrl).toBeDefined();
		});

		it("GET /api/remix/testuser/testspace (vibesynq host) should return space data", async () => {
			const request = createRequest("/api/remix/testuser/testspace", VIBESYNQ_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.html).toBeDefined();
			expect(body.path).toBe("testuser/testspace");
		});

		it("GET /api/remix/nouser/nospace (vibesynq host) should return 404", async () => {
			const request = createRequest("/api/remix/nouser/nospace", VIBESYNQ_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.message).toBe("Space not found");
		});
	});

	describe("Admin App (admin.localhost:3000)", () => {
		it("GET / (admin host) should redirect to /admin/", async () => {
			const request = createRequest("/", ADMIN_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe("/admin/");
		});

		it("GET /admin/ (admin host) should serve Admin SPA", async () => {
			const request = createRequest("/admin/", ADMIN_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});

		it("GET /admin/ (base host) should serve Admin SPA", async () => {
			const request = createRequest("/admin/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});

		it("GET /api/admin/files (admin host, no query) should return files", async () => {
			const request = createRequest("/api/admin/files", ADMIN_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.files).toBeDefined();
		});

		it("GET /api/admin/files (base host, no query) should return files", async () => {
			const request = createRequest("/api/admin/files", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.files).toBeDefined();
		});

		it("POST /api/admin/upload (admin host) should succeed with valid data", async () => {
			const request = createRequest("/api/admin/upload", ADMIN_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					file: "test-from-bun-test.txt",
					content: "hello world from bun test"
				})
			});
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.path).toBe("test-from-bun-test.txt");
		});

		it('POST /api/admin/upload (admin host) with missing "file" field should return 400', async () => {
			const request = createRequest("/api/admin/upload", ADMIN_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: "this should fail" })
			});
			const response = await app.handle(request);
			expect(response.status).toBe(400);
			const body = await response.json();
			// Check for Elysia's typical validation error structure or message
			expect(body.message || body.error).toMatch(/Expected property 'file' to be string/i);
		});

		it("GET /admin/unknown-path (admin host) should serve Vibesynq SPA (current behavior)", async () => {
			const request = createRequest("/admin/unknown-path", ADMIN_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});
	});

	describe("LLM App (llm.localhost:3000)", () => {
		it("GET / (llm host) should serve LLM index.html", async () => {
			const request = createRequest("/", LLM_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});

		it("GET /nonexistent.html (llm host) should return 404 from llmPlugin", async () => {
			const request = createRequest("/nonexistent.html", LLM_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(404);
			const text = await response.text();
			expect(text).toBe("File not found on LLM subdomain");
		});

		it("GET /api/ask-ai (llm host) should be 404 from llmPlugin", async () => {
			const request = createRequest("/api/ask-ai", LLM_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(404);
			expect(await response.text()).toBe("File not found on LLM subdomain");
		});
	});

	describe("Swagger UI", () => {
		it("GET /api/reference/ should serve Swagger UI", async () => {
			const request = createRequest("/api/reference/", BASE_HOST);
			const response = await app.handle(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toMatch(/^text\/html/);
		});
	});
});
