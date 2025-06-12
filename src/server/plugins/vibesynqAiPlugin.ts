import { PROVIDERS } from "@/utils/providers";
import { Elysia, t } from "elysia";

// VibeSynq AI endpoint plugin with strict rate limiting
export const vibesynqAiPlugin = new Elysia({ name: "vibesynq-ai" })
	// Apply strict rate limiting to AI endpoints
	// .use(strictRateLimit)
	.post(
		"/api/ask-ai",
		async ({
			body,
			set,
			request
		}: {
			body: {
				prompt: string;
				html?: string;
				previousPrompt?: string;
				provider: string;
				ApiKey?: string;
				ApiUrl?: string;
				Model?: string;
			};
			set: {
				status: number;
				headers: Record<string, string>;
			};
			request: Request;
		}) => {
			const { prompt, html, previousPrompt, provider, ApiKey, ApiUrl, Model } = body;
			const requestId = request.headers.get("X-Request-ID") || "unknown";

			// Simple logging for AI requests (logixlysia handles detailed logging)
			console.info(
				"[AI_REQUEST]",
				`Provider: ${provider}, Prompt length: ${prompt?.length || 0}`,
				{ requestId }
			);

			if (!prompt) {
				console.warn("[AI_REQUEST] Missing prompt", { requestId });

				set.status = 400;
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: "Missing required field: prompt",
						timestamp: new Date().toISOString(),
						requestId
					},
					timestamp: new Date().toISOString(),
					requestId
				};
			}

			const systemPrompt = `ONLY USE HTML, CSS AND JAVASCRIPT. No explanations, ONLY CODE. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script> in the head). Also, try to ellaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`;

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
				console.warn(
					"[AI_REQUEST]",
					`Token limit exceeded: ${TOKENS_USED}/${selectedProvider.max_tokens}`,
					{
						requestId,
						provider: selectedProvider.name
					}
				);

				set.status = 400;
				return {
					success: false,
					error: {
						code: "BAD_REQUEST",
						message: `Context is too long. ${selectedProvider.name} allows ${selectedProvider.max_tokens} max tokens.`,
						details: {
							tokensUsed: TOKENS_USED,
							maxTokens: selectedProvider.max_tokens,
							provider: selectedProvider.name
						},
						timestamp: new Date().toISOString(),
						requestId
					},
					timestamp: new Date().toISOString(),
					requestId
				};
			}

			if (selectedProvider && ["local", "openrouter"].includes(selectedProvider.id)) {
				try {
					if (!ApiUrl || !Model) {
						console.error("[AI_REQUEST] Missing provider config", {
							requestId,
							provider: selectedProvider.id,
							hasApiUrl: !!ApiUrl,
							hasModel: !!Model
						});

						set.status = 400;
						return {
							success: false,
							error: {
								code: "BAD_REQUEST",
								message:
									"Missing required fields for provider: API KEY, BASE URL, and MODEL.",
								timestamp: new Date().toISOString(),
								requestId
							},
							timestamp: new Date().toISOString(),
							requestId
						};
					}

					console.info(
						"[AI_REQUEST]",
						`Calling provider: ${selectedProvider.id} with model: ${Model}`,
						{ requestId }
					);

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

						console.error("[AI_REQUEST]", `Provider API error: ${response.status}`, {
							requestId,
							provider: selectedProvider.id,
							errorBody
						});

						set.status = response.status;
						return {
							success: false,
							error: {
								code: "EXTERNAL_API_ERROR",
								message: `AI Provider Error: ${response.status}`,
								details: errorBody,
								timestamp: new Date().toISOString(),
								requestId
							},
							timestamp: new Date().toISOString(),
							requestId
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
									const lines = chunk.split("\n");

									for (const line of lines) {
										if (line.startsWith("data: ")) {
											const data = line.slice(6);
											if (data === "[DONE]") {
												controller.close();
												return;
											}

											try {
												const parsed = JSON.parse(data);
												const content = parsed.choices?.[0]?.delta?.content;
												if (content) {
													controller.enqueue(
														new TextEncoder().encode(content)
													);
												}
											} catch (parseError) {
												// Ignore JSON parse errors for partial chunks
											}
										}
									}
								}
							} catch (streamError) {
								console.error("[AI_REQUEST] Stream error", {
									requestId,
									error: streamError
								});
								controller.error(streamError);
							} finally {
								try {
									reader.releaseLock();
								} catch (e) {
									// Ignore lock release errors
								}
							}
						}
					});

					set.headers["Content-Type"] = "text/plain";
					set.headers["Transfer-Encoding"] = "chunked";
					set.headers["Cache-Control"] = "no-cache";
					set.headers.Connection = "keep-alive";

					console.info("[AI_REQUEST] Streaming response started", {
						requestId,
						provider: selectedProvider.id
					});
					return stream;
				} catch (error) {
					console.error("[AI_REQUEST] Unexpected error", {
						requestId,
						provider: selectedProvider?.id,
						error: error instanceof Error ? error.message : String(error)
					});

					set.status = 500;
					return {
						success: false,
						error: {
							code: "INTERNAL_ERROR",
							message: "Internal server error",
							timestamp: new Date().toISOString(),
							requestId
						},
						timestamp: new Date().toISOString(),
						requestId
					};
				}
			}

			console.warn("[AI_REQUEST] Unsupported provider", { requestId, provider });

			set.status = 400;
			return {
				success: false,
				error: {
					code: "BAD_REQUEST",
					message: "Unsupported provider",
					timestamp: new Date().toISOString(),
					requestId
				},
				timestamp: new Date().toISOString(),
				requestId
			};
		},
		{
			body: t.Object({
				prompt: t.String({ minLength: 1 }),
				html: t.Optional(t.String()),
				previousPrompt: t.Optional(t.String()),
				provider: t.String({ default: "auto" }),
				ApiKey: t.Optional(t.String()),
				ApiUrl: t.Optional(t.String()),
				Model: t.Optional(t.String())
			}),
			response: {
				200: t.Any(),
				400: t.Object({
					success: t.Boolean(),
					error: t.Object({
						code: t.String(),
						message: t.String(),
						details: t.Optional(t.Any()),
						timestamp: t.String(),
						requestId: t.String()
					}),
					timestamp: t.String(),
					requestId: t.String()
				}),
				500: t.Object({
					success: t.Boolean(),
					error: t.Object({
						code: t.String(),
						message: t.String(),
						timestamp: t.String(),
						requestId: t.String()
					}),
					timestamp: t.String(),
					requestId: t.String()
				})
			}
		}
	);
