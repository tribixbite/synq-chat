import { Elysia, t } from "elysia";

// Plugin for the Vibesynq app
export const vibesynqPlugin = new Elysia()
	// Vibesynq static files
	.group("/vibesynq", app => {
		// Static files are disabled for now
		// app.use(
		// 	staticPlugin({
		// 		assets: "./apps/vibesynq/public",
		// 		alwaysStatic: true,
		// 		indexHTML: true,
		// 		prefix: "/"
		// 	})
		// )
		return app;
	})
	// Legacy ask-ai endpoint - redirects to new vibesynq-ai endpoint
	.post(
		"/api/ask-ai",
		async ({ body, set }) => {
			// Redirect old API calls to new endpoint with transformed body
			const { prompt, html, previousPrompt, provider, ApiKey, ApiUrl, Model } = body;

			// Transform old format to new format
			interface LocalSettings {
				[key: string]: unknown;
			}

			const localSettings: LocalSettings = {};

			if (provider === "local") {
				localSettings.apiKey = ApiKey;
				localSettings.apiUrl = ApiUrl;
				localSettings.model = Model;
			} else if (provider === "openrouter") {
				localSettings.openRouterApiKey = ApiKey;
				localSettings.openRouterApiUrl = ApiUrl;
				localSettings.openRouterModel = Model;
			}

			const newBody = {
				prompt,
				html,
				previousPrompt,
				provider,
				localSettings
			};

			// Forward to new endpoint
			const response = await fetch(
				`http://localhost:${process.env.PORT || 3000}/api/vibesynq-ai`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(newBody)
				}
			);

			// Forward the response
			if (response.ok) {
				set.headers = {
					"Content-Type": response.headers.get("Content-Type") || "text/plain",
					"Cache-Control": "no-cache",
					Connection: "keep-alive"
				};
				return response.body;
			}
			const errorBody = await response.json();
			set.status = response.status;
			return errorBody;
		},
		{
			body: t.Object({
				prompt: t.String(),
				html: t.Optional(t.String()),
				previousPrompt: t.Optional(t.String()),
				provider: t.String(),
				ApiKey: t.Optional(t.String()),
				ApiUrl: t.Optional(t.String()),
				Model: t.Optional(t.String())
			})
		}
	)
	// New route for login
	.get("/api/login", ({ set }) => {
		// In a real app, this would redirect to an OAuth provider
		// For now, returning a placeholder redirect URL
		// set.redirect = "https://huggingface.co/oauth/authorize?...."; // Example
		return { redirectUrl: "#" }; // Placeholder
	})
	// New route for loading a space (remix)
	.get("/api/remix/:owner/:name", async ({ params, set }) => {
		const { owner, name } = params;
		console.log(`Attempting to load space: ${owner}/${name}`);
		// Placeholder logic: In a real app, you'd fetch space data from a DB or service
		// For now, let's simulate finding a space or not
		if (owner === "testuser" && name === "testspace") {
			return {
				html: "<!DOCTYPE html><html><body><h1>Loaded Test Space</h1></body></html>",
				isOwner: true, // or false, depending on auth
				path: `${owner}/${name}`
			};
		}
		set.status = 404;
		return { message: "Space not found" };
	})
	.get("*", async ({ params }: { params: { "*": string | undefined } }) => {
		// console.log(`Vibesynq catch-all for: ${params?.["*"]}`);
		// Serve the main index.html for SPA routing for any unhandled GET requests on this plugin.
		// The staticPlugin within the "/vibesynq" group should handle serving index.html for paths under /vibesynq/.
		// This top-level catch-all ensures that even paths like vibesynq.domain.com/some/route not starting with /vibesynq/
		// (if the guard allows such requests to reach here) will attempt to serve the SPA.
		const spaIndexHtmlPath = "./apps/vibesynq/public/index.html";
		const file = Bun.file(spaIndexHtmlPath);
		if (await file.exists()) {
			return new Response(file, {
				headers: { "Content-Type": "text/html; charset=utf-8" }
			});
		}
		// Fallback if index.html is somehow not found, though this shouldn't happen in a correct build.
		return new Response("Vibesynq application not found.", {
			status: 404,
			headers: { "Content-Type": "text/plain" }
		});
	});
