import {
	buildApiUrl,
	formatAuthHeader,
	getFallbackProviders,
	getProvider,
	type Provider
} from "@/utils/providers";
import { Elysia, t } from "elysia";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Ensure llm-responses directory exists
const LLM_RESPONSES_DIR = join(process.cwd(), "llm-responses");
if (!existsSync(LLM_RESPONSES_DIR)) {
	mkdirSync(LLM_RESPONSES_DIR, { recursive: true });
}

// Type definitions for better type safety
interface LocalSettings {
	[key: string]: string | undefined;
	openRouterApiKey?: string;
	openRouterModel?: string;
	openRouterApiUrl?: string;
	anthropicApiKey?: string;
	anthropicModel?: string;
	openaiApiKey?: string;
	openaiModel?: string;
	googleApiKey?: string;
	googleModel?: string;
	xaiApiKey?: string;
	xaiModel?: string;
	chutesApiKey?: string;
	chutesModel?: string;
	groqApiKey?: string;
	groqModel?: string;
	togetherApiKey?: string;
	togetherModel?: string;
	apiKey?: string;
	model?: string;
	apiUrl?: string;
}

interface ErrorInfo {
	message: string;
	status?: number;
	shouldFallback?: boolean;
	isQuotaError?: boolean;
	[key: string]: unknown;
}

interface ResponseMetadata {
	promptLength?: number;
	responseLength?: number;
	[key: string]: unknown;
}

// LLM Response logging function
async function saveLLMResponse(
	requestId: string,
	prompt: string,
	response: string,
	providerId: string,
	model: string,
	success: boolean,
	error?: ErrorInfo,
	metadata?: ResponseMetadata
) {
	try {
		const timestamp = new Date().toISOString();
		const filename = `${timestamp.replace(/[:.]/g, "-")}_${requestId}_${providerId}_${success ? "success" : "error"}.json`;
		const filepath = join(LLM_RESPONSES_DIR, filename);

		const logData = {
			timestamp,
			requestId,
			prompt,
			response,
			provider: {
				id: providerId,
				model: model
			},
			success,
			error: error
				? {
						message: error.message || String(error),
						status: error.status,
						details: error
					}
				: undefined,
			metadata: {
				promptLength: prompt.length,
				responseLength: response.length,
				...metadata
			}
		};

		writeFileSync(filepath, JSON.stringify(logData, null, 2));
		console.log(`[LLM_RESPONSE] Saved to ${filename}`);
	} catch (saveError) {
		console.error("[LLM_RESPONSE] Failed to save response:", saveError);
	}
}

// Get API configuration from settings
function getApiConfig(
	providerId: string,
	localSettings: LocalSettings
): { provider: Provider; apiKey: string; model: string; apiUrl: string } | null {
	const provider = getProvider(providerId);
	if (!provider) {
		console.error(`[API_CONFIG] Provider not found: ${providerId}`);
		return null;
	}

	// Get API key from local settings
	let apiKey = "";
	let model = "";
	let apiUrl = provider.apiUrl;

	switch (providerId) {
		case "openrouter":
			apiKey = localSettings.openRouterApiKey || "";
			model = localSettings.openRouterModel || provider.models[0]?.id || "";
			apiUrl = localSettings.openRouterApiUrl || provider.apiUrl;
			break;
		case "anthropic":
			apiKey = localSettings.anthropicApiKey || "";
			model = localSettings.anthropicModel || provider.models[0]?.id || "";
			break;
		case "openai":
			apiKey = localSettings.openaiApiKey || "";
			model = localSettings.openaiModel || provider.models[0]?.id || "";
			break;
		case "google":
			apiKey = localSettings.googleApiKey || "";
			model = localSettings.googleModel || provider.models[0]?.id || "";
			break;
		case "xai":
			apiKey = localSettings.xaiApiKey || "";
			model = localSettings.xaiModel || provider.models[0]?.id || "";
			break;
		case "chutes":
			apiKey = localSettings.chutesApiKey || "";
			model = localSettings.chutesModel || provider.models[0]?.id || "";
			break;
		case "groq":
			apiKey = localSettings.groqApiKey || "";
			model = localSettings.groqModel || provider.models[0]?.id || "";
			break;
		case "together":
			apiKey = localSettings.togetherApiKey || "";
			model = localSettings.togetherModel || provider.models[0]?.id || "";
			break;
		case "local":
			apiKey = localSettings.apiKey || "";
			model = localSettings.model || provider.models[0]?.id || "";
			apiUrl = localSettings.apiUrl || provider.apiUrl;
			break;
		default:
			console.error(`[API_CONFIG] Unsupported provider: ${providerId}`);
			return null;
	}

	// Check if API key is required but missing
	if (provider.requiresApiKey && !apiKey) {
		console.error(`[API_CONFIG] API key required but missing for provider: ${providerId}`);
		return null;
	}

	console.info(`[API_CONFIG] Configuration loaded for ${provider.name}`, {
		providerId,
		model,
		apiUrl,
		hasApiKey: !!apiKey,
		requiresApiKey: provider.requiresApiKey
	});

	return { provider, apiKey, model, apiUrl };
}

// Single API call attempt
async function tryApiCall(
	prompt: string,
	systemPrompt: string,
	config: { provider: Provider; apiKey: string; model: string; apiUrl: string },
	previousPrompt?: string,
	html?: string,
	requestId?: string
): Promise<
	| { success: true; response: Response; fullResponse: string }
	| { success: false; error: ErrorInfo }
> {
	const { provider, apiKey, model, apiUrl } = config;

	try {
		// Build request headers
		const headers = formatAuthHeader(provider, apiKey);

		// Build messages array
		const messages = [
			{ role: "system", content: systemPrompt },
			...(previousPrompt ? [{ role: "user", content: previousPrompt }] : []),
			...(html ? [{ role: "assistant", content: `The current code is: ${html}.` }] : []),
			{ role: "user", content: prompt }
		];

		// Build request body
		const requestBody = {
			model: model,
			messages: messages,
			stream: true,
			max_tokens: Math.min(4096, provider.maxTokens),
			temperature: 0.7
		};

		console.info("[LLM_REQUEST] Making API call", {
			requestId: requestId || "unknown",
			provider: provider.id,
			model: model,
			apiUrl: buildApiUrl(provider),
			messageCount: messages.length,
			hasApiKey: !!apiKey,
			requestBody: {
				...requestBody,
				messages: messages.map(m => ({ role: m.role, contentLength: m.content.length }))
			}
		});

		const response = await fetch(buildApiUrl(provider), {
			method: "POST",
			headers: headers,
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorBody = await response.text();

			console.error("[LLM_REQUEST] API call failed", {
				requestId: requestId || "unknown",
				provider: provider.id,
				status: response.status,
				statusText: response.statusText,
				errorBody: errorBody,
				headers: Object.fromEntries(response.headers.entries())
			});

			// Check for quota/rate limit errors that should trigger fallback
			const isQuotaError =
				response.status === 429 ||
				errorBody.toLowerCase().includes("quota") ||
				errorBody.toLowerCase().includes("rate limit") ||
				errorBody.toLowerCase().includes("insufficient");

			return {
				success: false,
				error: {
					status: response.status,
					message: errorBody,
					isQuotaError,
					shouldFallback: isQuotaError
				}
			};
		}

		// For streaming responses, we need to read the full response
		let fullResponse = "";
		if (response.body) {
			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split("\n").filter(line => line.trim());

					for (const line of lines) {
						if (!line || !line.startsWith("data: ") || line.includes("[DONE]")) {
							continue;
						}

						const json = line.slice(6).trim();
						if (!json.startsWith("{")) continue;

						try {
							const message = JSON.parse(json);
							const content = message?.choices?.[0]?.delta?.content;
							if (content) {
								fullResponse += content;
							}
						} catch (e) {
							console.error("Error parsing stream JSON:", (e as Error).message);
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		}

		console.info("[LLM_REQUEST] API call successful", {
			requestId: requestId || "unknown",
			provider: provider.id,
			status: response.status,
			responseLength: fullResponse.length,
			hasStream: !!response.body
		});

		return { success: true, response, fullResponse };
	} catch (error) {
		console.error("[LLM_REQUEST] API call threw exception", {
			requestId: requestId || "unknown",
			provider: provider.id,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});

		return {
			success: false,
			error: {
				message: error instanceof Error ? error.message : String(error),
				shouldFallback: true
			}
		};
	}
}

// Try API call with automatic fallback
async function tryApiCallWithFallback(
	prompt: string,
	systemPrompt: string,
	providerId: string,
	localSettings: LocalSettings,
	previousPrompt?: string,
	html?: string,
	requestId?: string
): Promise<
	| { success: true; response: Response; fullResponse: string; providerId: string }
	| { success: false; error: ErrorInfo }
> {
	// Try primary provider first
	const primaryConfig = getApiConfig(providerId, localSettings);
	if (primaryConfig) {
		const result = await tryApiCall(
			prompt,
			systemPrompt,
			primaryConfig,
			previousPrompt,
			html,
			requestId
		);
		if (result.success) {
			await saveLLMResponse(
				requestId || "unknown",
				prompt,
				result.fullResponse,
				providerId,
				primaryConfig.model,
				true
			);
			return { ...result, providerId };
		}
		await saveLLMResponse(
			requestId || "unknown",
			prompt,
			"",
			providerId,
			primaryConfig.model,
			false,
			result.error
		);

		// Don't fallback if it's not a quota/rate limit error
		if (!result.error?.shouldFallback) {
			return result;
		}
	}

	// Try fallback providers
	const fallbackProviders = getFallbackProviders().filter(id => id !== providerId);
	console.info(`[AI_REQUEST] Trying fallback providers: ${fallbackProviders.join(", ")}`);

	for (const fallbackProviderId of fallbackProviders) {
		const config = getApiConfig(fallbackProviderId, localSettings);
		if (!config) continue;

		console.info(`[AI_REQUEST] Attempting fallback to ${config.provider.name}`);
		const result = await tryApiCall(
			prompt,
			systemPrompt,
			config,
			previousPrompt,
			html,
			requestId
		);

		if (result.success) {
			console.info(`[AI_REQUEST] Fallback successful with ${config.provider.name}`);
			await saveLLMResponse(
				requestId || "unknown",
				prompt,
				result.fullResponse,
				fallbackProviderId,
				config.model,
				true
			);
			return { ...result, providerId: fallbackProviderId };
		}
		console.warn(`[AI_REQUEST] Fallback failed with ${config.provider.name}:`, result.error);
		await saveLLMResponse(
			requestId || "unknown",
			prompt,
			"",
			fallbackProviderId,
			config.model,
			false,
			result.error
		);
	}

	return {
		success: false,
		error: {
			message: "All providers failed",
			details: "Primary provider and all fallback providers failed"
		}
	};
}

// VibeSynq AI Plugin
export const vibesynqAiPlugin = new Elysia().post(
	"/api/vibesynq-ai",
	async ({ body, set }) => {
		const { prompt, html, previousPrompt, provider, localSettings = {} } = body;

		if (!prompt) {
			set.status = 400;
			return {
				ok: false,
				message: "Missing required field: prompt"
			};
		}

		const systemPrompt = `ONLY USE HTML, CSS AND JAVASCRIPT. No explanations, ONLY CODE. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script> in the head). Also, try to elaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`;

		const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		console.info("[AI_REQUEST] Starting request", {
			requestId,
			provider,
			promptLength: prompt.length,
			hasHtml: !!html,
			hasPreviousPrompt: !!previousPrompt
		});

		// Determine which provider to use
		let selectedProvider = provider;
		if (provider === "auto") {
			// Use the first available provider with API key
			const availableProviders = getFallbackProviders();
			for (const providerId of availableProviders) {
				const config = getApiConfig(providerId, localSettings);
				if (config) {
					selectedProvider = providerId;
					break;
				}
			}

			if (selectedProvider === "auto") {
				set.status = 400;
				return {
					ok: false,
					message:
						"No configured providers available. Please set up at least one provider with API credentials."
				};
			}
		}

		try {
			const result = await tryApiCallWithFallback(
				prompt,
				systemPrompt,
				selectedProvider,
				localSettings,
				previousPrompt,
				html,
				requestId
			);

			if (!result.success) {
				console.error("[AI_REQUEST] All providers failed", {
					requestId,
					error: result.error
				});

				set.status = 500;
				return {
					ok: false,
					message: result.error?.message || "AI request failed",
					details: result.error
				};
			}

			console.info("[AI_REQUEST] Request completed successfully", {
				requestId,
				provider: result.providerId,
				responseLength: result.fullResponse.length
			});

			// Return streaming response
			const stream = new ReadableStream({
				start(controller) {
					// Send the response content
					controller.enqueue(result.fullResponse);
					controller.close();
				}
			});

			set.headers = {
				"Content-Type": "text/plain",
				"Cache-Control": "no-cache",
				Connection: "keep-alive"
			};

			return stream;
		} catch (error: unknown) {
			console.error("AI request error:", (error as Error).message);

			const errorInfo: ErrorInfo = {
				message: (error as Error).message || "Unknown error occurred",
				status:
					typeof error === "object" && error !== null && "status" in error
						? (error as { status?: number }).status
						: undefined,
				shouldFallback: false
			};

			await saveLLMResponse(
				requestId,
				prompt,
				"",
				selectedProvider || "unknown",
				"unknown",
				false,
				errorInfo
			);

			set.status = 500;
			return {
				ok: false,
				message:
					(error as Error).message || "An error occurred while processing your request."
			};
		}
	},
	{
		body: t.Object({
			prompt: t.String(),
			html: t.Optional(t.String()),
			previousPrompt: t.Optional(t.String()),
			provider: t.String(),
			localSettings: t.Optional(
				t.Object({
					// Generic settings
					apiKey: t.Optional(t.String()),
					apiUrl: t.Optional(t.String()),
					model: t.Optional(t.String()),

					// Provider-specific settings
					openRouterApiKey: t.Optional(t.String()),
					openRouterApiUrl: t.Optional(t.String()),
					openRouterModel: t.Optional(t.String()),

					anthropicApiKey: t.Optional(t.String()),
					anthropicModel: t.Optional(t.String()),

					openaiApiKey: t.Optional(t.String()),
					openaiModel: t.Optional(t.String()),

					googleApiKey: t.Optional(t.String()),
					googleModel: t.Optional(t.String()),

					xaiApiKey: t.Optional(t.String()),
					xaiModel: t.Optional(t.String()),

					chutesApiKey: t.Optional(t.String()),
					chutesModel: t.Optional(t.String()),

					groqApiKey: t.Optional(t.String()),
					groqModel: t.Optional(t.String()),

					togetherApiKey: t.Optional(t.String()),
					togetherModel: t.Optional(t.String())
				})
			)
		})
	}
);
