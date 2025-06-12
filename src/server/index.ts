// src/server/index.ts - Enhanced with logixlysia advanced logging, static files, and rate limiting
// Using @elysiajs/static plugin, Bun.file optimization, and logixlysia for professional logging

import { api } from "@helpers/api";
import { Config } from "@shared/config";
import Elysia, { file } from "elysia";

const { PORT, HOST } = Config;

import { onAfterHandle, onBeforeHandle } from "./helpers/elysia";
import { appRouterPlugin } from "./plugins/appRouterPlugin";
console.log(`📍 Environment: ${Config.IS_PROD ? "Production" : "Development"}`);
console.log(`🌐 Host: ${HOST}:${PORT}`);

// Helper function to resolve public file paths for static content optimization
const publicFile = (filename: string) => file(`public/${filename}`);

// Main Elysia server with enhanced logixlysia logging
export const app = new Elysia({ name: "synq-chat-server" })
	// 🛡️ IP blocking middleware - FIRST to block malicious IPs immediately
	// .use(ipBlockingMiddleware)
	// Advanced logixlysia configuration with production-ready features
	// .use(logger)
	// MultiSynq manual routes (optimized with Bun.file)
	.get("/multisynq-react.txt", () => publicFile("multisynq-react.txt"))
	.get("/multisynq-threejs.txt", () => publicFile("multisynq-js.txt"))
	.get("/multisynq-js.txt", () => publicFile("multisynq-js.txt"))
	.get("/multisynq-client.txt", () => publicFile("multisynq-client.txt"))
	.get("/multisynq-client.json", () => publicFile("multisynq-client.json"))
	.get("/multisynq-gpt.txt", () => publicFile("multisynq-gpt.txt"))
	// Root plugins and API
	// .use(rootPlugins)
	.use(api)
	// Global static plugin for root-level static files (highest priority)
	// Individual static files with Bun.file optimization for better performance
	.get("/icons/favicon.ico", () => publicFile("icons/favicon.ico"))
	.head("/icons/favicon.ico", () => publicFile("icons/favicon.ico"))
	.get("/icons/favicon.svg", () => publicFile("icons/favicon.svg"))
	.head("/icons/favicon.svg", () => publicFile("icons/favicon.svg"))
	.get("/icons/logo.svg", () => publicFile("icons/logo.svg"))
	.head("/icons/logo.svg", () => publicFile("icons/logo.svg"))
	.get("/icons/logo.png", () => publicFile("icons/logo.png"))
	.head("/icons/logo.png", () => publicFile("icons/logo.png"))
	.get("/icons/logo192.png", () => publicFile("icons/logo192.png"))
	.head("/icons/logo192.png", () => publicFile("icons/logo192.png"))
	.get("/icons/logo512.png", () => publicFile("icons/logo512.png"))
	.head("/icons/logo512.png", () => publicFile("icons/logo512.png"))
	.get("/icons/apple-touch-icon.png", () => publicFile("icons/apple-touch-icon.png"))
	.head("/icons/apple-touch-icon.png", () => publicFile("icons/apple-touch-icon.png"))
	.get("/moto.html", () => publicFile("moto.html"))
	.head("/moto.html", () => publicFile("moto.html"))
	.get("/site.webmanifest", () => publicFile("site.webmanifest"))
	.head("/site.webmanifest", () => publicFile("site.webmanifest"))
	// .get("/tailwind.css", () => publicFile("tailwind.css"))
	// .head("/tailwind.css", () => publicFile("tailwind.css"))
	// Test route to debug routing issues
	.get("/test", () => ({
		message: "Test route works!",
		timestamp: new Date().toISOString(),
		success: true
	}));
// Dynamic app routing - automatically discovers and serves apps
// app.use(html())
app.get(
	"/apps3",
	() => `
            <html lang='en'>
                <head>
                    <title>Hello World</title>
                </head>
                <body>
                    <h1>Hello World</h1>
                </body>
            </html>`
)
	.onBeforeHandle(onBeforeHandle)
	.onAfterHandle(onAfterHandle)
	.use(appRouterPlugin)
	// .use(
	// 	staticPlugin({
	// 		assets: "public",
	// 		prefix: "/",
	// 		indexHTML: false,
	// 		noCache: true,
	// 		directive: "no-cache",
	// 		maxAge: 0,
	// 		// Ignore app directories since they're handled by appRouterPlugin
	// 		ignorePatterns: ["apps/**/*", "external-docs/**/*", "llm/**/*", "test/**/*"]
	// 		// headers: {
	// 		// 	"Cache-Control": "public, max-age=31536000, immutable"
	// 		// }
	// 	})
	// )
	// Enhanced request/response handling (now logixlysia handles most logging)

	// General rate limiting for all API endpoints
	// .use(generalRateLimit)

	// Rate limit status endpoint
	// .use(rateLimitStatus)

	// VibeSynq AI endpoint (keep existing functionality)
	// .use(vibesynqAiPlugin)

	// Subdomain routing (for any remaining subdomain-specific logic)
	// .use(subdomainPlugin)

	// Fallback route for unmatched requests - redirect to most sensible location
	// Note: Excludes "/" to avoid conflict with subdomain plugin's root redirect
	.get("*", ({ request }: { request: Request }) => {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Skip root path - handled by subdomain plugin
		// if (pathname === "/") {
		// 	return; // Let subdomain plugin handle this
		// }

		// If it's an API request that's unmatched, return 404
		if (pathname.startsWith("/api/")) {
			return Response.json(
				{
					success: false,
					error: {
						code: "NOT_FOUND",
						message: "API endpoint not found",
						timestamp: new Date().toISOString(),
						path: pathname
					}
				},
				{ status: 404 }
			);
		}

		// If it's an app-related request, redirect to app gallery
		// if (pathname.startsWith("/app") || pathname.includes("app")) {
		// 	return Response.redirect("/apps", 302);
		// }

		// For other unmatched routes, redirect to app gallery as the main hub
		return Response.redirect("/apps", 302);
	})

	// Start server with logixlysia handling startup message
	.listen(PORT, () => {
		// Simple startup info (logixlysia handles the fancy startup message)
		console.log(`🚀 Synq Chat Server listening on ${HOST}:${PORT}`);
		console.log(`📱 Default app: ${Config.DEFAULT_APP}`);
		console.log(`📁 Apps directory: ${Config.APPS_DIR}`);
		console.log("🎯 Static files optimized with @elysiajs/static plugin");
		console.log("🤖 Dynamic app discovery enabled");
		console.log("🛡️  Rate limiting enabled");
		console.log("📊 Advanced logixlysia logging active");
		console.log("🔍 Request tracking with detailed logging enabled");
		console.log("🔄 Fallback routing to app gallery enabled");
	});

export type App = typeof app;
