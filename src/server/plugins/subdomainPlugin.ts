import { AVAILABLE_APPS, Config, type AppKey } from "@shared/config";
import Elysia, { file } from "elysia";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { appRouterPlugin } from "./appRouterPlugin";
import { llmPlugin } from "./llmPlugin";

// Utility to get subdomain from host header
export const getSubdomain = (hostHeader: string): string | null => {
	if (!hostHeader) return null;
	const host = hostHeader.split(":")[0]; // Remove port

	// Handle IP addresses, localhost, and single-level domains
	if (/^(\d+\.){3}\d+$/.test(host) || !host.includes(".") || host === "localhost") {
		return null;
	}

	const parts = host.split(".");

	// For "subdomain.localhost" pattern
	if (parts.length === 2 && parts[1] === "localhost") {
		return parts[0] === "localhost" ? null : parts[0];
	}

	// For standard domains: sub.example.com -> "sub"
	if (parts.length > 2) {
		// Simple TLD detection - for production you might want a more robust solution
		if (parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3) {
			if (parts.length > 3) {
				return parts[0]; // e.g., sub.example.co.uk
			}
			return null; // e.g., example.co.uk - no subdomain
		}
		return parts[0]; // e.g., sub.example.com
	}
	return null; // e.g., example.com - no subdomain
};

// Check if an app exists and has static files
const appExists = (appKey: string): boolean => {
	const app = AVAILABLE_APPS[appKey as AppKey];
	if (!app) return false;

	// Check if the static directory exists
	const staticDir = resolve(app.staticDir);
	return existsSync(staticDir);
};

// Get app key from subdomain or path
const getAppFromSubdomainOrPath = (subdomain: string | null, pathname: string): AppKey | null => {
	// Handle special LLM subdomain
	if (subdomain === "llm") {
		return null; // LLM subdomain doesn't map to a regular app
	}

	// First, try to match subdomain
	if (subdomain && appExists(subdomain)) {
		return subdomain as AppKey;
	}

	// Then, try to match path prefix (e.g., /apps/admin/, /apps/vibesynq/)
	const pathSegments = pathname.split("/").filter(Boolean);
	if (pathSegments.length > 1 && pathSegments[0] === "apps") {
		const appKey = pathSegments[1];
		if (appExists(appKey)) {
			return appKey as AppKey;
		}
	}

	return null;
};

export const subdomainPlugin = new Elysia({ name: "subdomain" })
	// Add subdomain information to context
	.derive({ as: "global" }, ({ request }) => {
		const hostHeader = request.headers.get("host") || "";
		const subdomain = getSubdomain(hostHeader);
		console.log("subdomain", subdomain);
		const url = new URL(request.url);
		const targetApp = getAppFromSubdomainOrPath(subdomain, url.pathname);
		console.log("targetApp", targetApp);
		return {
			subdomain,
			targetApp,
			hostHeader
		};
	})
	// Root redirect to default app
	.get("/", () => {
		const defaultApp = Config.DEFAULT_APP;
		const redirectUrl = `/apps/${defaultApp}/`;
		return new Response(null, {
			status: 302,
			headers: {
				Location: redirectUrl
			}
		});
	})
	// Mount LLM plugin with subdomain guard
	.guard({ as: "scoped" }, app =>
		app.derive(({ subdomain }) => {
			if (subdomain !== "llm") {
				throw new Error("Not LLM subdomain");
			}
			return {};
		})
	)
	.use(llmPlugin)
	// Remove the guard and continue with regular app routing
	.guard({ as: "scoped" }, app =>
		app.derive(({ subdomain }) => {
			if (subdomain === "llm") {
				throw new Error("LLM subdomain handled by dedicated plugin");
			}
			return {};
		})
	)
	// Use the dynamic app router plugin for all app routes
	.use(appRouterPlugin)
	// Health endpoint
	.get("/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
		apps: Object.keys(AVAILABLE_APPS)
	}))
	// Static file serving from root public directory (for files like moto.html, etc.)
	.get("/:file", ({ params }: { params: { file: string } }) => {
		const filePath = resolve(`./public/${params.file}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`File not found: ${params.file}`);
	});
