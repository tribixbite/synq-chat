import { staticPlugin } from "@elysiajs/static";
import { type Context, Elysia } from "elysia";

// Plugin for handling LLM subdomain requests
export const llmPlugin = new Elysia()
	// Guard to only process LLM subdomain requests
	.guard({
		beforeHandle: ({ request }: Context) => {
			const host = request.headers.get("host") || "";
			const currentSubdomain = host.split(".")[0];
			// console.log("LLM Plugin Guard: Host:", host, "Subdomain:", currentSubdomain);
			// Only proceed if we're on the LLM subdomain
			return currentSubdomain === "llm";
		}
	})
	// Serve static files from the LLM directory
	.use(
		staticPlugin({
			assets: "./public/llm",
			indexHTML: true,
			alwaysStatic: true,
			prefix: "/"
		})
	)
	// Catch-all handler for LLM subdomain
	.get("*", ({ path }) => {
		console.log(`LLM subdomain request not found: ${path}`);
		return new Response("File not found on LLM subdomain", {
			status: 404,
			headers: { "Content-Type": "text/plain" }
		});
	});
