// src/server/index.ts - Corrected version
// Fixed the LLM guard to prevent blocking other routes

import { staticPlugin } from "@elysiajs/static";
import { api } from "@helpers/api";
import { onBeforeHandle, onError } from "@helpers/elysia";
import { AVAILABLE_APPS, Config } from "@shared/config";
import { rootPlugins } from "@src/server/plugins/rootPlugins";
import Elysia from "elysia";
import { subdomainPlugin } from "./plugins/subdomainPlugin";
import { vibesynqAiPlugin } from "./plugins/vibesynqAiPlugin";

const { PORT, HOST } = Config;

// Main Elysia server following best practices
export const app = new Elysia({ name: "synq-chat-server" })
	// Global error handling
	.onError(c => onError(c))
	.onBeforeHandle(onBeforeHandle)

	// MultiSynq manual routes (keep these as requested)
	.get("/multisynq-react.txt", () => Bun.file("./public/multisynq-react.txt"))
	.get("/multisynq-threejs.txt", () => Bun.file("./public/multisynq-js.txt"))
	.get("/multisynq-js.txt", () => Bun.file("./public/multisynq-js.txt"))

	// Root plugins and API
	.use(rootPlugins)
	.use(api)

	// VibeSynq AI endpoint (keep existing functionality)
	.use(vibesynqAiPlugin)

	// Subdomain and app routing
	.use(subdomainPlugin)

	// Fallback static serving for any remaining public files
	.use(
		staticPlugin({
			assets: "./public",
			prefix: "/public",
			alwaysStatic: true,
			noCache: !Config.IS_PROD
		})
	)

	// Health check endpoint
	.get("/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
		apps: Object.keys(AVAILABLE_APPS)
	}))

	.listen(PORT, () => {
		console.log(`🚀 Synq Chat Server listening on ${HOST}:${PORT}`);
		console.log(`📱 Default app: ${Config.DEFAULT_APP}`);
		console.log(`📁 Apps directory: ${Config.APPS_DIR}`);
	});

export type App = typeof app;
