import { AVAILABLE_APPS, Config, type AppKey } from "@shared/config";
import Elysia, { file } from "elysia";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
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
	// Mount LLM plugin with subdomain guard
	.guard({ as: "scoped" }, app =>
		app.derive(({ subdomain }) => {
			if (subdomain !== "llm") {
				throw new Error("Not LLM subdomain");
			}
		})
	)
	.use(llmPlugin)
	// Remove the guard and continue with regular app routing
	.guard({ as: "scoped" }, app =>
		app.derive(({ subdomain }) => {
			if (subdomain === "llm") {
				throw new Error("LLM subdomain handled by dedicated plugin");
			}
		})
	)
	// Dynamic routes for admin app
	.get(`/apps/${AVAILABLE_APPS.admin.path}/assets/:file`, ({ params }) => {
		const filePath = resolve(`${AVAILABLE_APPS.admin.staticDir}/assets/${params.file}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${params.file}`);
	})
	.get(`/apps/${AVAILABLE_APPS.admin.path}/assets/*`, ({ params }) => {
		const assetPath = params["*"];
		const filePath = resolve(`${AVAILABLE_APPS.admin.staticDir}/assets/${assetPath}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${assetPath}`);
	})
	.get(`/apps/${AVAILABLE_APPS.admin.path}/`, () => {
		const indexPath = resolve(`${AVAILABLE_APPS.admin.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.admin.name} app not found`);
	})
	.get(`/apps/${AVAILABLE_APPS.admin.path}/*`, ({ path }) => {
		// For SPA routes, serve the index.html unless it's an asset
		if (path.includes("/assets/")) {
			const assetPath = path.replace(`/apps/${AVAILABLE_APPS.admin.path}/`, "");
			const filePath = resolve(`${AVAILABLE_APPS.admin.staticDir}/${assetPath}`);
			if (existsSync(filePath)) {
				return file(filePath);
			}
			throw new Error(`Asset not found: ${assetPath}`);
		}
		const indexPath = resolve(`${AVAILABLE_APPS.admin.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.admin.name} app not found`);
	})
	// Dynamic routes for vibesynq app
	.get(`/apps/${AVAILABLE_APPS.vibesynq.path}/assets/:file`, ({ params }) => {
		const filePath = resolve(`${AVAILABLE_APPS.vibesynq.staticDir}/assets/${params.file}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${params.file}`);
	})
	.get(`/apps/${AVAILABLE_APPS.vibesynq.path}/assets/*`, ({ params }) => {
		const assetPath = params["*"];
		const filePath = resolve(`${AVAILABLE_APPS.vibesynq.staticDir}/assets/${assetPath}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${assetPath}`);
	})
	.get(`/apps/${AVAILABLE_APPS.vibesynq.path}/`, () => {
		const indexPath = resolve(`${AVAILABLE_APPS.vibesynq.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.vibesynq.name} app not found`);
	})
	.get(`/apps/${AVAILABLE_APPS.vibesynq.path}/*`, ({ path }) => {
		// For SPA routes, serve the index.html unless it's an asset
		if (path.includes("/assets/")) {
			const assetPath = path.replace(`/apps/${AVAILABLE_APPS.vibesynq.path}/`, "");
			const filePath = resolve(`${AVAILABLE_APPS.vibesynq.staticDir}/${assetPath}`);
			if (existsSync(filePath)) {
				return file(filePath);
			}
			throw new Error(`Asset not found: ${assetPath}`);
		}
		const indexPath = resolve(`${AVAILABLE_APPS.vibesynq.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.vibesynq.name} app not found`);
	})
	// Dynamic routes for app1
	.get(`/apps/${AVAILABLE_APPS.app1.path}/assets/:file`, ({ params }) => {
		const filePath = resolve(`${AVAILABLE_APPS.app1.staticDir}/assets/${params.file}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${params.file}`);
	})
	.get(`/apps/${AVAILABLE_APPS.app1.path}/assets/*`, ({ params }) => {
		const assetPath = params["*"];
		const filePath = resolve(`${AVAILABLE_APPS.app1.staticDir}/assets/${assetPath}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${assetPath}`);
	})
	.get(`/apps/${AVAILABLE_APPS.app1.path}/`, () => {
		const indexPath = resolve(`${AVAILABLE_APPS.app1.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.app1.name} app not found`);
	})
	.get(`/apps/${AVAILABLE_APPS.app1.path}/*`, ({ path }) => {
		// For SPA routes, serve the index.html unless it's an asset
		if (path.includes("/assets/")) {
			const assetPath = path.replace(`/apps/${AVAILABLE_APPS.app1.path}/`, "");
			const filePath = resolve(`${AVAILABLE_APPS.app1.staticDir}/${assetPath}`);
			if (existsSync(filePath)) {
				return file(filePath);
			}
			throw new Error(`Asset not found: ${assetPath}`);
		}
		const indexPath = resolve(`${AVAILABLE_APPS.app1.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.app1.name} app not found`);
	})
	// Dynamic routes for app2
	.get(`/apps/${AVAILABLE_APPS.app2.path}/assets/:file`, ({ params }) => {
		const filePath = resolve(`${AVAILABLE_APPS.app2.staticDir}/assets/${params.file}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${params.file}`);
	})
	.get(`/apps/${AVAILABLE_APPS.app2.path}/assets/*`, ({ params }) => {
		const assetPath = params["*"];
		const filePath = resolve(`${AVAILABLE_APPS.app2.staticDir}/assets/${assetPath}`);
		if (existsSync(filePath)) {
			return file(filePath);
		}
		throw new Error(`Asset not found: ${assetPath}`);
	})
	.get(`/apps/${AVAILABLE_APPS.app2.path}/`, () => {
		const indexPath = resolve(`${AVAILABLE_APPS.app2.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.app2.name} app not found`);
	})
	.get(`/apps/${AVAILABLE_APPS.app2.path}/*`, ({ path }) => {
		// For SPA routes, serve the index.html unless it's an asset
		if (path.includes("/assets/")) {
			const assetPath = path.replace(`/apps/${AVAILABLE_APPS.app2.path}/`, "");
			const filePath = resolve(`${AVAILABLE_APPS.app2.staticDir}/${assetPath}`);
			if (existsSync(filePath)) {
				return file(filePath);
			}
			throw new Error(`Asset not found: ${assetPath}`);
		}
		const indexPath = resolve(`${AVAILABLE_APPS.app2.staticDir}/index.html`);
		if (existsSync(indexPath)) {
			return file(indexPath);
		}
		throw new Error(`${AVAILABLE_APPS.app2.name} app not found`);
	})
	// Root route handler for subdomain/path-based routing
	.get("/", ({ subdomain, targetApp, redirect }) => {
		// If we have a target app from subdomain, redirect to its path with /apps/ prefix
		if (targetApp) {
			return redirect(`/apps/${AVAILABLE_APPS[targetApp].path}/`);
		}

		// If subdomain doesn't match any app, redirect to default app
		if (subdomain && !targetApp) {
			return redirect(`/apps/${AVAILABLE_APPS[Config.DEFAULT_APP as AppKey].path}/`);
		}

		// No subdomain, redirect to default app
		return redirect(`/apps/${AVAILABLE_APPS[Config.DEFAULT_APP as AppKey].path}/`);
	})
	// Catch-all for unmatched routes - handle app redirects (LLM is handled by dedicated plugin)
	.get("*", ({ subdomain, targetApp, redirect, path }) => {
		// Handle regular app subdomain redirects
		// If we have a subdomain that matches an app, redirect to that app with /apps/ prefix
		if (subdomain && appExists(subdomain)) {
			return redirect(`/apps/${AVAILABLE_APPS[subdomain as AppKey].path}${path}`);
		}

		// Otherwise redirect to default app
		return redirect(`/apps/${AVAILABLE_APPS[Config.DEFAULT_APP as AppKey].path}${path}`);
	});
