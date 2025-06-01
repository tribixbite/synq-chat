// src/server/index.ts - Corrected version
// Fixed the LLM guard to prevent blocking other routes

import { api } from "@helpers/api";
import { onBeforeHandle, onError } from "@helpers/elysia";
import { Config } from "@shared/config";
import { rootPlugins } from "@src/server/plugins/rootPlugins";
import { subdomainPlugin } from "@src/server/plugins/subdomainPlugin";
import Elysia from "elysia";
import logixlysia from "logixlysia";
import { resolve } from "node:path";
import { vibesynqAiPlugin } from "./plugins/vibesynqAiPlugin";

const { PORT, HOST } = Config;

// Helper function to resolve public file paths
const publicFile = (filename: string) => Bun.file(resolve(process.cwd(), "public", filename));

// Main Elysia server following best practices
export const app = new Elysia({ name: "synq-chat-server" })
	// Static files served directly (highest priority)
	.get("/favicon.ico", () => publicFile("favicon.ico"))
	.head("/favicon.ico", () => publicFile("favicon.ico"))
	.get("/favicon.svg", () => publicFile("favicon.svg"))
	.head("/favicon.svg", () => publicFile("favicon.svg"))
	.get("/logo.svg", () => publicFile("logo.svg"))
	.head("/logo.svg", () => publicFile("logo.svg"))
	.get("/logo.png", () => publicFile("logo.png"))
	.head("/logo.png", () => publicFile("logo.png"))
	.get("/moto.html", () => publicFile("moto.html"))
	.head("/moto.html", () => publicFile("moto.html"))
	.get("/site.webmanifest", () => publicFile("site.webmanifest"))
	.head("/site.webmanifest", () => publicFile("site.webmanifest"))

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
	.get("/multisynq-react.txt", () => publicFile("multisynq-react.txt"))
	.get("/multisynq-threejs.txt", () => publicFile("multisynq-js.txt"))
	.get("/multisynq-js.txt", () => publicFile("multisynq-js.txt"))

	// Root plugins and API
	.use(rootPlugins)
	.use(api)

	// VibeSynq AI endpoint (keep existing functionality)
	.use(vibesynqAiPlugin)

	// Subdomain and app routing (this includes app-specific static serving)
	.use(subdomainPlugin)
	.onError(c => onError(c))

	// Health check endpoint (removed duplicate - it's now in subdomainPlugin)
	.listen(PORT, () => {
		console.log(`🚀 Synq Chat Server listening on ${HOST}:${PORT}`);
		console.log(`📱 Default app: ${Config.DEFAULT_APP}`);
		console.log(`📁 Apps directory: ${Config.APPS_DIR}`);
	});

export type App = typeof app;
