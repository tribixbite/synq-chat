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

// Create a dedicated handler for the LLM subdomain
const app = new Elysia()
	.onError(c => onError(c))
	.onBeforeHandle(onBeforeHandle)
	.get("/multisynq-react.txt", () => Bun.file("./public/multisynq-react.txt"))
	.get("/multisynq-js.txt", () => Bun.file("./public/multisynq-js.txt"))
	.use(rootPlugins)
	.use(api)
	// Extract subdomain information for routing
	.derive(({ request }) => {
		const host = request.headers.get("host") || "";
		return {
			subdomain: host.split(".")[0]
		};
	})
	// LLM subdomain plugin - applied first for proper route handling
	.use(llmPlugin)
	.use(adminPlugin)
	.use(vibesynqPlugin)

	// Static file serving for the public directory
	.use(
		staticPlugin({
			assets: "./public",
			alwaysStatic: true,
			noCache: true
		})
	)

	// Default route handler with subdomain detection
	.get("/", (context: Context & { subdomain: string }) => {
		const { set, subdomain } = context;

		// Redirect based on subdomain
		if (subdomain === "admin") {
			set.redirect = "/admin/";
			return;
		}

		if (subdomain === "vibesynq") {
			set.redirect = "/vibesynq/";
			return;
		}

		// 'llm' subdomain requests are handled by llmPlugin and should not reach here
		// if llmPlugin correctly handles all its routes (including root for the subdomain).

		// Default redirect for the base domain (e.g., localhost:3000) or any unhandled subdomains.
		set.redirect = "/vibesynq/";
	})

	.listen(PORT, () => console.log(`Server listening on ${HOST}:${PORT}`));

export type App = typeof app;
