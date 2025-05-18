// src/server/index.ts - Corrected version
// Fixed the LLM guard to prevent blocking other routes

import { staticPlugin } from "@elysiajs/static";
import { api } from "@helpers/api";
import { onBeforeHandle, onError } from "@helpers/elysia";
import { Config } from "@shared/config";
import { rootPlugins } from "@src/server/plugins/rootPlugins";
import Elysia from "elysia";
import { adminPlugin } from "./plugins/adminPlugin";
import { llmPlugin } from "./plugins/llmPlugin";
import { vibesynqPlugin } from "./plugins/vibesynqPlugin";

const { PORT, HOST } = Config;

// This ipSub Elysia instance is defined but not actively used since .use(ipSub) is commented out.
// The actual 'ipSub' on the context comes from the .derive call on the main 'app' instance.
// const ipSub = new Elysia({ name: 'subdomain' }) // Original definition, can be kept or removed if truly unused.
// 	.derive(
// 		{ as: 'global' },
// 		({ server, request }) => ({
// 			ipSub: {
// 				ip: server?.requestIP(request),
// 				subdomain: request.headers.get("host")?.split(".")[0]
// 			}
// 		})
// 	)

// Create a dedicated handler for the LLM subdomain
export const app = new Elysia()
	.onError(c => onError(c))
	.onBeforeHandle(onBeforeHandle)
	.get("/multisynq-react.txt", () => Bun.file("./public/multisynq-react.txt"))
	.get("/multisynq-js.txt", () => Bun.file("./public/multisynq-js.txt"))
	.use(rootPlugins)
	.use(api)
	// .use(ipSub) // This was correctly commented out
	.derive({ as: "global" }, ({ server, request }) => ({
		ipSub: {
			ip: server?.requestIP(request), // Type: Bun.SocketAddress | null | undefined
			subdomain: request.headers.get("host")?.split(".")[0] // Type: string | undefined
		}
	}))
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
	.use(llmPlugin)

	// Default route handler with subdomain detection
	.get(
		"/",
		({
			set,
			request,
			ipSub
		}: {
			set: {
				redirect: (path: string, status?: number) => Response;
				status?: number | string;
				headers?: Record<string, string>;
			};
			request: Request;
			ipSub: {
				ip: unknown;
				subdomain: string | undefined;
			};
		}) => {
			const subdomainToRedirect = ipSub?.subdomain || "vibesynq";
			return set.redirect(`/${subdomainToRedirect}/`);
		}
	)

	// 	: Context & { ipSub: { ip: string, subdomain: string } }) => {
	// 	if (ipSub.subdomain === "admin") => redirect("/admin/")
	// 	// Redirect based on subdomain
	// 	if (ipSub.subdomain === "admin") => "/admin/"
	// 	if (ipSub.subdomain === "diy") => "/vibesynq/"

	// })

	.listen(PORT, () => console.log(`Server listening on ${HOST}:${PORT}`));

export type App = typeof app;
