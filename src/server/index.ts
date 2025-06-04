// src/server/index.ts - Enhanced with logixlysia advanced logging, static files, and rate limiting
// Using @elysiajs/static plugin, Bun.file optimization, and logixlysia for professional logging

import { staticPlugin } from "@elysiajs/static";
import { api } from "@helpers/api";
import { onAfterHandle, onBeforeHandle } from "@helpers/elysia";
import { Config } from "@shared/config";
import { appRouterPlugin } from "@src/server/plugins/appRouterPlugin";
import { rootPlugins } from "@src/server/plugins/rootPlugins";
import { subdomainPlugin } from "@src/server/plugins/subdomainPlugin";
import Elysia from "elysia";
import logixlysia from "logixlysia";
import { resolve } from "node:path";
import { generalRateLimit, ipBlockingMiddleware, rateLimitStatus } from "./plugins/rateLimitPlugin";
import { vibesynqAiPlugin } from "./plugins/vibesynqAiPlugin";

const { PORT, HOST } = Config;

// Helper function to resolve public file paths for static content optimization
const publicFile = (filename: string) => Bun.file(resolve(process.cwd(), "public", filename));

// Custom error transport for logixlysia
const errorNotificationTransport = {
	log: async (level: string, message: string, meta: Record<string, unknown>) => {
		// Only send notifications for errors and critical warnings
		if (
			level === "ERROR" ||
			(level === "WARNING" && typeof meta?.status === "number" && meta.status >= 500)
		) {
			// In production, you could send to Slack, Discord, or email
			console.error(`🚨 CRITICAL: [${level}] ${message}`, meta);
		}
	}
};

// Main Elysia server with enhanced logixlysia logging
export const app = new Elysia({ name: "synq-chat-server" })
	// 🛡️ IP blocking middleware - FIRST to block malicious IPs immediately
	.use(ipBlockingMiddleware)

	// Advanced logixlysia configuration with production-ready features
	.use(
		logixlysia({
			config: {
				// Startup configuration
				showStartupMessage: true,
				startupMessageFormat: Config.IS_PROD ? "simple" : "banner",

				// Timestamp configuration
				timestamp: {
					translateTime: "yyyy-mm-dd HH:MM:ss"
				},

				// IP tracking enabled
				ip: true,

				// File logging
				// logFilePath: "./logs/access.log",

				// Custom log format with available placeholders
				customLogFormat:
					"🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}",

				// Smart filtering based on environment
				logFilter: Config.IS_PROD
					? {
							// Production: Only log warnings, errors, and important status codes
							level: ["WARNING", "ERROR"],
							status: [400, 401, 403, 404, 429, 500, 502, 503, 504]
						}
					: {
							// Development: Log everything for debugging
							level: ["INFO", "WARNING", "ERROR"],
							method: ["GET", "POST", "PUT", "DELETE", "PATCH"]
						}

				// Custom transports for error notifications and file logging
				// transports: Config.IS_PROD
				// 	? [
				// 			errorNotificationTransport,
				// 			// File transport for errors only
				// 			{
				// 				log: async (
				// 					level: string,
				// 					message: string,
				// 					meta: Record<string, unknown>
				// 				) => {
				// 					if (level === "ERROR") {
				// 						const errorLog = `${new Date().toISOString()} [ERROR] ${message} ${JSON.stringify(meta)}\n`;
				// 						await Bun.write("./logs/errors.log", errorLog, {
				// 							createPath: true
				// 						});
				// 					}
				// 				}
				// 			}
				// 		]
				// 	: [
				// 			// Development: just console output (default)
				// 		]
			}
		})
	)

	// Global static plugin for root-level static files (highest priority)
	.use(
		staticPlugin({
			assets: "public",
			prefix: "/",
			indexHTML: false,
			// Ignore app directories since they're handled by appRouterPlugin
			ignorePatterns: ["apps/**/*", "external-docs/**/*", "llm/**/*", "test/**/*"],
			headers: {
				"Cache-Control": "public, max-age=31536000, immutable"
			}
		})
	)

	// Individual static files with Bun.file optimization for better performance
	.get("/favicon.ico", () => publicFile("favicon.ico"))
	.head("/favicon.ico", () => publicFile("favicon.ico"))
	.get("/favicon.svg", () => publicFile("favicon.svg"))
	.head("/favicon.svg", () => publicFile("favicon.svg"))
	.get("/logo.svg", () => publicFile("logo.svg"))
	.head("/logo.svg", () => publicFile("logo.svg"))
	.get("/logo.png", () => publicFile("logo.png"))
	.head("/logo.png", () => publicFile("logo.png"))
	.get("/logo192.png", () => publicFile("logo192.png"))
	.head("/logo192.png", () => publicFile("logo192.png"))
	.get("/logo512.png", () => publicFile("logo512.png"))
	.head("/logo512.png", () => publicFile("logo512.png"))
	.get("/apple-touch-icon.png", () => publicFile("apple-touch-icon.png"))
	.head("/apple-touch-icon.png", () => publicFile("apple-touch-icon.png"))
	.get("/moto.html", () => publicFile("moto.html"))
	.head("/moto.html", () => publicFile("moto.html"))
	.get("/site.webmanifest", () => publicFile("site.webmanifest"))
	.head("/site.webmanifest", () => publicFile("site.webmanifest"))

	// Test route to debug routing issues
	.get("/test", () => ({
		message: "Test route works!",
		timestamp: new Date().toISOString(),
		success: true
	}))

	// Enhanced request/response handling (now logixlysia handles most logging)
	.onBeforeHandle(onBeforeHandle)
	.onAfterHandle(onAfterHandle)

	// General rate limiting for all API endpoints
	.use(generalRateLimit)

	// Rate limit status endpoint
	.use(rateLimitStatus)

	// MultiSynq manual routes (optimized with Bun.file)
	.get("/multisynq-react.txt", () => publicFile("multisynq-react.txt"))
	.get("/multisynq-threejs.txt", () => publicFile("multisynq-js.txt"))
	.get("/multisynq-js.txt", () => publicFile("multisynq-js.txt"))
	.get("/multisynq-client.txt", () => publicFile("multisynq-client.txt"))
	.get("/multisynq-client.json", () => publicFile("multisynq-client.json"))
	.get("/multisynq-gpt.txt", () => publicFile("multisynq-gpt.txt"))

	// Root plugins and API
	.use(rootPlugins)
	.use(api)

	// VibeSynq AI endpoint (keep existing functionality)
	.use(vibesynqAiPlugin)

	// Dynamic app routing - automatically discovers and serves apps
	.use(appRouterPlugin)

	// Subdomain routing (for any remaining subdomain-specific logic)
	.use(subdomainPlugin)

	// Fallback route for unmatched requests - redirect to most sensible location
	// Note: Excludes "/" to avoid conflict with subdomain plugin's root redirect
	.get("*", ({ request }: { request: Request }) => {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Skip root path - handled by subdomain plugin
		if (pathname === "/") {
			return; // Let subdomain plugin handle this
		}

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
		if (pathname.startsWith("/app") || pathname.includes("app")) {
			return Response.redirect("/apps", 302);
		}

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
