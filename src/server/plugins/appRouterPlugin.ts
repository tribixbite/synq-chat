import { AVAILABLE_APPS, type AppKey } from "@shared/config";
import Elysia from "elysia";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Helper function to serve an app's index.html for SPA routing
const serveAppIndex = (appKey: AppKey) => {
	const app = AVAILABLE_APPS[appKey];
	const indexPath = resolve(`${app.staticDir}/index.html`);

	if (existsSync(indexPath)) {
		return Bun.file(indexPath);
	}

	throw new Error(`${app.name} app not found`);
};

// Helper function to serve app assets
const serveAppAsset = (appKey: AppKey, assetPath: string) => {
	const app = AVAILABLE_APPS[appKey];
	const filePath = resolve(`${app.staticDir}/${assetPath}`);

	if (existsSync(filePath)) {
		return Bun.file(filePath);
	}

	throw new Error(`Asset not found: ${assetPath}`);
};

// Dynamic app router plugin that sets up routes for all available apps
export const appRouterPlugin = new Elysia({ name: "appRouter" });

// Register routes for each app in AVAILABLE_APPS
for (const [appKey, appConfig] of Object.entries(AVAILABLE_APPS)) {
	const typedAppKey = appKey as AppKey;
	const appPath = `/apps/${appConfig.path}`;

	// App index route
	appRouterPlugin.get(`${appPath}/`, () => serveAppIndex(typedAppKey));

	// Asset routes with specific file parameter
	appRouterPlugin.get(`${appPath}/assets/:file`, ({ params }: { params: { file: string } }) =>
		serveAppAsset(typedAppKey, `assets/${params.file}`)
	);

	// Asset routes with wildcard for nested paths
	appRouterPlugin.get(`${appPath}/assets/*`, ({ params }: { params: { "*": string } }) =>
		serveAppAsset(typedAppKey, `assets/${params["*"]}`)
	);

	// SPA fallback route - serves index.html for all non-asset routes
	appRouterPlugin.get(`${appPath}/*`, ({ path }: { path: string }) => {
		// If it's an asset request, try to serve it directly
		if (path.includes("/assets/")) {
			const assetPath = path.replace(`${appPath}/`, "");
			return serveAppAsset(typedAppKey, assetPath);
		}

		// Otherwise, serve index.html for SPA routing
		return serveAppIndex(typedAppKey);
	});
}
