// src/server/index.ts - Corrected version
// Fixed the LLM guard to prevent blocking other routes

import { staticPlugin } from "@elysiajs/static";
import { api } from "@helpers/api";
import { onBeforeHandle, onError } from "@helpers/elysia";
import { plugins } from "@helpers/plugins";
import { Config } from "@shared/config";
import { type Context, Elysia } from "elysia";

const { PORT, HOST } = Config;

// Create a dedicated handler for the LLM subdomain
const llmSubdomainHandler = new Elysia()
	.derive(({ request }) => {
		const host = request.headers.get("host") || "";
		const isLlmSubdomain = host.startsWith("llm.");
		return { isLlmSubdomain };
	})
	.guard(
		// IMPORTANT: Guard only processes if isLlmSubdomain is true
		{ beforeHandle: ({ isLlmSubdomain }) => isLlmSubdomain },
		app =>
			app
				.use(
					staticPlugin({
						// assets: "./public/llm",
						indexHTML: true,
						alwaysStatic: true
						// prefix: "/"
					})
				)
				.get("*", ({ path }) => {
					console.log(`LLM subdomain not found: ${path}`);
					return new Response("File not found on LLM subdomain", {
						status: 404,
						headers: { "Content-Type": "text/plain" }
					});
				})
	);

// Main application server
const app = new Elysia()
	.onError(c => onError(c))
	.onBeforeHandle(onBeforeHandle)
	.use(plugins)
	.use(api)
	// Add the LLM subdomain handler
	// .use(llmSubdomainHandler)
	.use(
		staticPlugin({
			prefix: "/vibesynq",
			assets: "./apps/vibesynq/public",
			alwaysStatic: true,
			indexHTML: true
		})
	)
	.use(
		staticPlugin({
			prefix: "/admin",
			assets: "./apps/admin/public",
			alwaysStatic: true,
			indexHTML: true
		})
	)
	.use(
		staticPlugin({
			// prefix: "/",
			assets: "./public",
			alwaysStatic: true,
			noCache: true
		})
	)
	.derive(({ request }) => {
		const host = request.headers.get("host") || "";
		return {
			subdomain: host.split(".")[0]
		};
	})
	// Handle root path and subdomain routing
	.get("/", (context: Context & { subdomain: string }) => {
		const { set, subdomain } = context;

		// For subdomains, redirect to their respective apps
		if (subdomain === "vibesynq") {
			set.redirect = "/vibesynq/";
			return;
		}

		if (subdomain === "admin") {
			set.redirect = "/admin/";
			return;
		}

		// Default to Vibesynq app for all other cases
		set.redirect = "/vibesynq/";
	})
	.listen(PORT, () => console.log(`Server listening on ${HOST}:${PORT}`));

export type App = typeof app;
