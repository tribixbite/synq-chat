import { AVAILABLE_APPS, type AppKey } from "@shared/config";
import Elysia from "elysia";

// Admin-specific API routes
export const adminApiPlugin = new Elysia({ name: "admin-api" }).group(
	"/api/admin",
	app =>
		app
			.get("/status", () => ({ status: "Admin API running" }))
			.get("/users", () => ({ users: [] })) // Placeholder
	// Add more admin-specific routes here
);

// VibeSynq-specific API routes (keep existing AI endpoint)
export const vibesynqApiPlugin = new Elysia({ name: "vibesynq-api" }).group(
	"/api/vibesynq",
	app => app.get("/status", () => ({ status: "VibeSynq API running" }))
	// The existing /api/ask-ai endpoint will be imported separately
);

// App1-specific API routes
export const app1ApiPlugin = new Elysia({ name: "app1-api" }).group("/api/app1", app =>
	app
		.get("/status", () => ({ status: "App1 API running" }))
		.get("/data", () => ({ message: "Hello from App1" }))
);

// App2-specific API routes
export const app2ApiPlugin = new Elysia({ name: "app2-api" }).group("/api/app2", app =>
	app
		.get("/status", () => ({ status: "App2 API running" }))
		.get("/data", () => ({ message: "Hello from App2" }))
);

// Combined app plugins
export const appApiPlugins = new Elysia({ name: "app-apis" })
	.use(adminApiPlugin)
	.use(vibesynqApiPlugin)
	.use(app1ApiPlugin)
	.use(app2ApiPlugin);

// Utility to check if a request is for a specific app
export const isAppRequest = (subdomain: string | null, path: string, appKey: AppKey): boolean => {
	// Check subdomain match
	if (subdomain === appKey) return true;

	// Check path prefix match
	const pathPrefix = `/${AVAILABLE_APPS[appKey].path}`;
	return path.startsWith(pathPrefix);
};
