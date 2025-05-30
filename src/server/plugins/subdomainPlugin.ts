import { staticPlugin } from "@elysiajs/static";
import { AVAILABLE_APPS, Config, type AppKey } from "@shared/config";
import Elysia, { file } from "elysia";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

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

	// Then, try to match path prefix (e.g., /admin/, /vibesynq/)
	const pathSegments = pathname.split("/").filter(Boolean);
	if (pathSegments.length > 0) {
		const firstSegment = pathSegments[0];
		if (appExists(firstSegment)) {
			return firstSegment as AppKey;
		}
	}

	return null;
};

export const subdomainPlugin = new Elysia({ name: "subdomain" })
	// Add subdomain information to context
	.derive({ as: "global" }, ({ request }) => {
		const hostHeader = request.headers.get("host") || "";
		const subdomain = getSubdomain(hostHeader);
		const url = new URL(request.url);
		const targetApp = getAppFromSubdomainOrPath(subdomain, url.pathname);

		return {
			subdomain,
			targetApp,
			hostHeader
		};
	})
	// Static asset serving for each app
	.use(
		staticPlugin({
			assets: "./public/admin",
			prefix: "/admin",
			alwaysStatic: true,
			noCache: false
		})
	)
	.use(
		staticPlugin({
			assets: "./public/vibesynq",
			prefix: "/vibesynq",
			alwaysStatic: true,
			noCache: false
		})
	)
	.use(
		staticPlugin({
			assets: "./public/app1",
			prefix: "/app1",
			alwaysStatic: true,
			noCache: false
		})
	)
	.use(
		staticPlugin({
			assets: "./public/app2",
			prefix: "/app2",
			alwaysStatic: true,
			noCache: false
		})
	)
	// Manual file serving for each app index.html (fallback)
	.get("/admin/", () => {
		const indexPath = resolve("./public/admin/index.html");
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error("Admin app not found");
	})
	.get("/vibesynq/", () => {
		const indexPath = resolve("./public/vibesynq/index.html");
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error("VibeSynq app not found");
	})
	.get("/app1/", () => {
		const indexPath = resolve("./public/app1/index.html");
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error("App1 not found");
	})
	.get("/app2/", () => {
		const indexPath = resolve("./public/app2/index.html");
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error("App2 not found");
	})
	// Root route handler for subdomain/path-based routing
	.get("/", ({ subdomain, targetApp, redirect }) => {
		// Handle LLM subdomain root
		if (subdomain === "llm") {
			const llmIndex = resolve("./public/llm/index.html");
			if (existsSync(llmIndex)) {
				return file(llmIndex);
			}
			throw new Error("LLM index not found");
		}

		// If we have a target app from subdomain, redirect to its path
		if (targetApp) {
			return redirect(`/${AVAILABLE_APPS[targetApp].path}/`);
		}

		// If subdomain doesn't match any app, redirect to default app
		if (subdomain && !targetApp) {
			return redirect(`/${AVAILABLE_APPS[Config.DEFAULT_APP as AppKey].path}/`);
		}

		// No subdomain, redirect to default app
		return redirect(`/${AVAILABLE_APPS[Config.DEFAULT_APP as AppKey].path}/`);
	})
	// Catch-all for unmatched routes - handle LLM subdomain and app redirects
	.get("*", ({ subdomain, targetApp, redirect, path }) => {
		// Handle LLM subdomain file serving FIRST
		if (subdomain === "llm") {
			// Remove leading slash from path
			let filePath = path.startsWith("/") ? path.substring(1) : path;

			// Handle /public/ prefixed requests by removing the redundant "public/" prefix
			if (filePath.startsWith("public/")) {
				filePath = filePath.substring("public/".length);
			}

			// Try LLM-specific directory first
			const llmPath = resolve(`./public/llm/${filePath}`);
			// Fallback to root public directory for shared files
			const publicPath = resolve(`./public/${filePath}`);

			// Check LLM directory first
			if (existsSync(llmPath)) {
				return file(llmPath);
			}
			// Fallback to root public directory
			if (existsSync(publicPath)) {
				return file(publicPath);
			}

			// If no file found, serve LLM index.html if it exists
			const llmIndex = resolve("./public/llm/index.html");
			if (existsSync(llmIndex)) {
				return file(llmIndex);
			}

			throw new Error(`File not found: ${path}`);
		}

		// Handle regular app subdomain redirects
		// If we have a subdomain that matches an app, redirect to that app
		if (subdomain && appExists(subdomain)) {
			return redirect(`/${AVAILABLE_APPS[subdomain as AppKey].path}${path}`);
		}

		// Otherwise redirect to default app
		return redirect(`/${AVAILABLE_APPS[Config.DEFAULT_APP as AppKey].path}${path}`);
	});
