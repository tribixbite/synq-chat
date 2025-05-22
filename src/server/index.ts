// src/server/index.ts - Corrected version
// Fixed the LLM guard to prevent blocking other routes

import { staticPlugin } from "@elysiajs/static";
import { api } from "@helpers/api";
import { onBeforeHandle, onError } from "@helpers/elysia";
import { Config } from "@shared/config";
import { rootPlugins } from "@src/server/plugins/rootPlugins";
import Elysia, { type Context } from "elysia";
import { adminPlugin } from "./plugins/adminPlugin";
import { llmPlugin } from "./plugins/llmPlugin";
import { vibesynqPlugin } from "./plugins/vibesynqPlugin";

const { PORT, HOST } = Config;

// Robust subdomain detection function
const getSubdomain = (hostHeader: string): string | null => {
	if (!hostHeader) return null;
	const host = hostHeader.split(":")[0]; // Remove port for accurate parsing

	// Handle IP addresses, localhost, and single-level domains (e.g., "example" without TLD)
	if (/^(\\d+\\.){3}\\d+$/.test(host) || !host.includes(".") || host === "localhost") {
		return null;
	}
	const parts = host.split(".");

	// For "subdomain.localhost" or "subdomain.localhost:port"
	if (parts.length === 2 && parts[1] === "localhost") {
		return parts[0] === "localhost" ? null : parts[0]; // technically "localhost.localhost" is invalid
	}

	// Standard domains:
	// example.com -> null (no subdomain)
	// sub.example.com -> "sub"
	// sub.example.co.uk -> "sub"
	if (parts.length > 2) {
		// Check if the last two parts form a common TLD pattern (e.g., co.uk, com.au)
		// This is a simplified check; a full TLD list would be more robust but complex.
		if (parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3) {
			if (parts.length > 3) {
				// e.g., sub.example.co.uk (4 parts)
				return parts[0];
			}
			return null; // e.g. example.co.uk (3 parts) - no subdomain
		}
		return parts[0]; // e.g. sub.example.com (3 parts)
	}
	return null; // e.g. example.com (2 parts) - no subdomain
};

// Define the shape of derived properties for context typing
interface DerivedProps {
	subdomain: string | null;
	// Simplified IP address type for now
	ipAddress: string | undefined | null;
}

// Create a dedicated handler for the LLM subdomain
export const app = new Elysia()
	.onError(c => onError(c))
	.onBeforeHandle(onBeforeHandle)
	.get("/multisynq-react.txt", () => Bun.file("./public/multisynq-react.txt"))
	.get("/multisynq-threejs.txt", () => Bun.file("./public/multisynq-js.txt"))
	.get("/multisynq-js.txt", () => Bun.file("./public/multisynq-js.txt"))
	.use(rootPlugins)
	.use(api)
	.derive({ as: "global" }, ({ server, request }) => ({
		subdomain: getSubdomain(request.headers.get("host") || ""),
		ipAddress: server?.requestIP(request)?.address // Access .address for string IP
	}))
	.get("*", async (context: Context & DerivedProps) => {
		const { subdomain, request, set } = context;
		const path = new URL(request.url).pathname;

		if (subdomain === "admin" || (subdomain === null && path.startsWith("/admin/"))) {
			return adminPlugin.handle(request);
		}
		if (subdomain === "llm") {
			return llmPlugin.handle(request);
		}

		// Fallback to vibesynqPlugin for main domain, 'vibesynq' subdomain, or any other case
		// The root path redirect is handled by the specific .get("/") handler below.
		if (
			path === "/" &&
			(subdomain === null ||
				subdomain === "vibesynq" ||
				subdomain === "admin" ||
				subdomain === "llm")
		) {
			// Let the specific .get("/") handle the redirect for root path for any configured subdomain/main.
			// This ensures the .get("/") always has a chance to correctly redirect from the absolute root.
			// If we return vibesynqPlugin.handle(request) here for '/', it might serve content before redirect.
		} else {
			return vibesynqPlugin.handle(request);
		}
		// If this point is reached, it means path was '/' and it will be handled by the next .get("/") route.
	})

	// Static file serving for the root public directory.
	// IMPORTANT: This might be shadowed by the .get('*') handler above for most GET requests.
	// Static assets should ideally be served by the plugins themselves if they are path-specific
	// or this static server should have a more specific prefix if it serves truly global assets.
	.use(
		staticPlugin({
			assets: "./public",
			prefix: "/",
			alwaysStatic: true,
			noCache: true
		})
	)
	.get("/", (context: Context & DerivedProps) => {
		const { redirect, subdomain } = context;

		if (subdomain === "admin") {
			const adminPath = "/admin/";
			return redirect(adminPath);
		}
		if (subdomain === "llm") {
			// llmPlugin handles its own root (e.g. index.html via its staticPlugin).
			// The .get('*') should have already dispatched to llmPlugin.handle for subdomain 'llm'.
			// So, doing nothing here is correct, letting the previous handler complete.
			return;
		}
		// For main domain or vibesynq subdomain, redirect to /vibesynq/
		const currentSub =
			subdomain === "vibesynq" ? "vibesynq" : subdomain === null ? "vibesynq" : subdomain;
		const redirectPath = `/${currentSub || "vibesynq"}/`;
		return redirect(redirectPath);
	})
	.listen(PORT, () => {
		// Using template literal for console.log as preferred by linter
		console.log(`Server listening on ${HOST}:${PORT}`);
	});

export type App = typeof app;
