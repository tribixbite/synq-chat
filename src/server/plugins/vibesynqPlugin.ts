import { staticPlugin } from "@elysiajs/static";
import { PROVIDERS } from "@src/utils/providers";
import { Elysia, t } from "elysia";

// Plugin for the Vibesynq app
export const vibesynqPlugin = new Elysia()
	// Vibesynq static files
	.group("/vibesynq", app =>
		app.use(
			staticPlugin({
				assets: "./apps/vibesynq/public",
				alwaysStatic: true,
				indexHTML: true,
				prefix: "/"
			})
		)
	)
	// Vibesynq AI endpoint
	.post(
		"/api/ask-ai",
		async ({ body, set }) => {
			const { prompt, html, previousPrompt, provider, ApiKey, ApiUrl, Model } = body;

			if (!prompt) {
				set.status = 400;
				return {
					ok: false,
					message: "Missing required fields"
				};
			}

			const systemPrompt = `ONLY USE HTML, CSS AND JAVASCRIPT. No explanations, ONLY CODE. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Use as much as you can TailwindCSS for the CSS, if you can\'t do something with TailwindCSS, then use custom CSS (make sure to import <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script> in the head). Also, try to ellaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`;

			let TOKENS_USED = prompt?.length || 0;
			if (previousPrompt) TOKENS_USED += previousPrompt.length;
			if (html) TOKENS_USED += html.length;

			const DEFAULT_PROVIDER = PROVIDERS.openrouter;
			const selectedProvider =
				provider === "auto"
					? DEFAULT_PROVIDER
					: (PROVIDERS[provider as keyof typeof PROVIDERS] ?? DEFAULT_PROVIDER);

			if (
				provider !== "auto" &&
				selectedProvider &&
				TOKENS_USED >= selectedProvider.max_tokens
			) {
				set.status = 400;
				return {
					ok: false,
					openSelectProvider: true,
					message: `Context is too long. ${selectedProvider.name} allow ${selectedProvider.max_tokens} max tokens.`
				};
			}

			if (selectedProvider && ["local", "openrouter"].includes(selectedProvider.id)) {
				try {
					if (!ApiUrl || !Model) {
						set.status = 400;
						return {
							ok: false,
							message:
								"Missing required fields for provider, set API KEY, BASE URL, and MODEL."
						};
					}

					const response = await fetch(`${ApiUrl}/chat/completions`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${ApiKey}`
						},
						body: JSON.stringify({
							model: Model,
							messages: [
								{ role: "system", content: systemPrompt },
								...(previousPrompt
									? [{ role: "user", content: previousPrompt }]
									: []),
								...(html
									? [
											{
												role: "assistant",
												content: `The current code is: ${html}.`
											}
										]
									: []),
								{ role: "user", content: prompt }
							],
							stream: true
						})
					});

					if (!response.ok) {
						const errorBody = await response.text();
						set.status = response.status;
						return {
							ok: false,
							message: `API Error: ${response.status} - ${errorBody}`
						};
					}

					const stream = new ReadableStream({
						async start(controller) {
							if (!response.body) {
								controller.close();
								return;
							}

							const reader = response.body.getReader();
							const decoder = new TextDecoder();

							try {
								while (true) {
									const { done, value } = await reader.read();
									if (done) break;

									const chunk = decoder.decode(value, { stream: true });
									const lines = chunk.split("\n").filter(line => line.trim());

									for (const line of lines) {
										if (
											!line ||
											!line.startsWith("data: ") ||
											line.includes("[DONE]")
										) {
											continue;
										}

										if (line.includes("exceeded")) {
											console.error(
												"Token limit exceeded during stream:",
												line
											);
											controller.enqueue(
												JSON.stringify({
													ok: false,
													error: "Token limit exceeded",
													message: line
												})
											);
											controller.close();
											return;
										}

										const json = line.slice(6).trim();
										if (!json.startsWith("{")) continue;

										try {
											const message = JSON.parse(json);
											const content = message?.choices?.[0]?.delta?.content;
											if (content) {
												controller.enqueue(content);
											}
										} catch (e: unknown) {
											console.error(
												"Error parsing stream JSON:",
												(e as Error).message
											);
										}
									}
								}
							} catch (error: unknown) {
								console.error("Streaming error:", (error as Error).message);
								controller.error(error as Error);
							} finally {
								controller.close();
							}
						}
					});

					set.headers = {
						"Content-Type": "text/plain",
						"Cache-Control": "no-cache",
						Connection: "keep-alive"
					};

					return stream;
				} catch (error: unknown) {
					console.error("Ask AI error:", (error as Error).message);

					if ((error as Error).message.includes("exceeded")) {
						set.status = 402;
						return { ok: false, message: (error as Error).message };
					}

					set.status = 500;
					return {
						ok: false,
						message:
							(error as Error).message ||
							"An error occurred while processing your request."
					};
				}
			} else {
				set.status = 400;
				return {
					ok: false,
					message: "Selected provider is not supported or not found."
				};
			}
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
	.get("*", ({ params }: { params: { "*": string | undefined } }) => {
		console.log(`Vibesynq catch-all for: ${params?.["*"]}`);
		// This should ideally serve index.html from ./apps/vibesynq/dist/
		// The staticPlugin with prefix: "/" and indexHTML: true within this Elysia instance should handle it.
		return new Response("Vibesynq SPA Fallback. Check static plugin config.", {
			headers: { "Content-Type": "text/html" }
		});
	});
