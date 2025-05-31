// src/server/index.ts - Corrected version
// Fixed the LLM guard to prevent blocking other routes

import { api } from "@helpers/api";
import { onBeforeHandle, onError } from "@helpers/elysia";
import { Config } from "@shared/config";
import { rootPlugins } from "@src/server/plugins/rootPlugins";
import { subdomainPlugin } from "@src/server/plugins/subdomainPlugin";
import Elysia from "elysia";
import logixlysia from "logixlysia";
import { vibesynqAiPlugin } from "./plugins/vibesynqAiPlugin";

const { PORT, HOST } = Config;

// Main Elysia server following best practices
export const app = new Elysia({ name: "synq-chat-server" })
	// Root redirect to default app (highest priority)
	.get("/", () => {
		return { message: "Root route works!", redirect: `/apps/${Config.DEFAULT_APP}/` };
	})
	// Alternative root route
	.get("/index", () => {
		const redirectUrl = `/apps/${Config.DEFAULT_APP}/`;
		return new Response(null, {
			status: 302,
			headers: {
				Location: redirectUrl
			}
		});
	})
	// Test route to debug routing issues
	.get("/test", () => ({ message: "Test route works!" }))
	.use(
		logixlysia({
			config: {
				showStartupMessage: true,
				startupMessageFormat: "simple",
				timestamp: {
					translateTime: "yyyy-mm-dd HH:MM:ss"
				},
				ip: true,
				logFilePath: "./logs/example.log",
				customLogFormat:
					"🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}",
				logFilter: {
					level: ["ERROR", "WARNING"],
					status: [500, 404],
					method: "GET"
				}
			}
		})
	)
	// Global error handling
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

	// Subdomain and app routing (this includes app-specific static serving)
	.use(subdomainPlugin)
	.onError(c => onError(c))

	// Root-level static file serving for files like moto.html, index.html, etc.
	// Commented out as it interferes with subdomain plugin's root route handling
	// .use(
	// 	staticPlugin({
	// 		assets: "./public",
	// 		prefix: "/"
	// 		// alwaysStatic: true,
	// 		// noCache: !Config.IS_PROD
	// 	})
	// )

	// Health check endpoint (removed duplicate - it's now in subdomainPlugin)
	.listen(PORT, () => {
		console.log(`🚀 Synq Chat Server listening on ${HOST}:${PORT}`);
		console.log(`📱 Default app: ${Config.DEFAULT_APP}`);
		console.log(`📁 Apps directory: ${Config.APPS_DIR}`);
	});

export type App = typeof app;
