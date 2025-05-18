import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";

// Plugin for handling LLM subdomain requests.
// This version has no internal guard and expects to be mounted conditionally by the main app.
export const llmPlugin = new Elysia({
	name: "llmRoutes" // Renamed for clarity, as it now only defines routes
})
	// Serve static files from the LLM directory
	.use(
		staticPlugin({
			assets: "./public/llm", // Path relative to the server's CWD
			indexHTML: true,
			alwaysStatic: true,
			prefix: "/" // Serve from the root of where this plugin is mounted
		})
	)
	// Catch-all handler for this plugin's scope if staticPlugin doesn't find a file.
	.get("*", ({ path }) => {
		// console.log(`LLM routes: request '${path}' not found by static plugin.`);
		return new Response("File not found on LLM subdomain", {
			status: 404,
			headers: { "Content-Type": "text/plain" }
		});
	});
