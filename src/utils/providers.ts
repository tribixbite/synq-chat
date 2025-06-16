export interface Provider {
	id: string;
	name: string;
	description: string;
	apiUrl: string;
	requiresApiKey: boolean;
	models: Model[];
	maxTokens: number;
	supportsStreaming: boolean;
	supportsVision: boolean;
	supportsAudio: boolean;
	pricing?: {
		inputTokens: number; // per million tokens
		outputTokens: number; // per million tokens
		currency: string;
	};
	rateLimit?: {
		requestsPerMinute: number;
		tokensPerMinute: number;
	};
	headers?: Record<string, string>;
	authHeader?: string; // Custom auth header format
}

export interface Model {
	id: string;
	name: string;
	description: string;
	contextLength: number;
	supportsVision?: boolean;
	supportsAudio?: boolean;
	supportsStreaming?: boolean;
	pricing?: {
		inputTokens: number;
		outputTokens: number;
	};
}

export interface Providers {
	[key: string]: Provider;
}

export const PROVIDERS: Providers = {
	// Test provider for testing purposes
	test: {
		id: "test",
		name: "Test Provider",
		description: "Mock provider for testing",
		apiUrl: "http://localhost:3000/test",
		requiresApiKey: false,
		maxTokens: 4096,
		supportsStreaming: true,
		supportsVision: false,
		supportsAudio: false,
		models: [
			{
				id: "test-model",
				name: "Test Model",
				description: "Mock model for testing",
				contextLength: 4096,
				supportsStreaming: true,
				pricing: { inputTokens: 0.0, outputTokens: 0.0 }
			}
		],
		pricing: {
			inputTokens: 0.0,
			outputTokens: 0.0,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 1000,
			tokensPerMinute: 1000000
		}
	},

	// OpenRouter - Aggregator with many models
	openrouter: {
		id: "openrouter",
		name: "OpenRouter",
		description: "Access to multiple AI models through a single API",
		apiUrl: "https://openrouter.ai/api/v1",
		requiresApiKey: true,
		maxTokens: 200000,
		supportsStreaming: true,
		supportsVision: true,
		supportsAudio: false,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "deepseek/deepseek-r1",
				name: "DeepSeek R1",
				description: "Latest reasoning model from DeepSeek",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.14, outputTokens: 0.28 }
			},
			{
				id: "deepseek/deepseek-chat",
				name: "DeepSeek Chat",
				description: "Fast and efficient chat model",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.14, outputTokens: 0.28 }
			},
			{
				id: "anthropic/claude-3.5-sonnet",
				name: "Claude 3.5 Sonnet",
				description: "Anthropic's most capable model",
				contextLength: 200000,
				supportsVision: true,
				supportsStreaming: true,
				pricing: { inputTokens: 3.0, outputTokens: 15.0 }
			},
			{
				id: "openai/gpt-4o",
				name: "GPT-4o",
				description: "OpenAI's multimodal flagship model",
				contextLength: 128000,
				supportsVision: true,
				supportsAudio: true,
				supportsStreaming: true,
				pricing: { inputTokens: 2.5, outputTokens: 10.0 }
			},
			{
				id: "google/gemini-2.0-flash",
				name: "Gemini 2.0 Flash",
				description: "Google's fast multimodal model",
				contextLength: 1048576,
				supportsVision: true,
				supportsAudio: true,
				supportsStreaming: true,
				pricing: { inputTokens: 0.075, outputTokens: 0.3 }
			},
			{
				id: "meta-llama/llama-3.3-70b-instruct",
				name: "Llama 3.3 70B",
				description: "Meta's latest open-source model",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.59, outputTokens: 0.79 }
			}
		],
		pricing: {
			inputTokens: 0.0, // Varies by model
			outputTokens: 0.0, // Varies by model
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 200,
			tokensPerMinute: 1000000
		}
	},

	// Anthropic Claude
	anthropic: {
		id: "anthropic",
		name: "Anthropic",
		description: "Claude AI models by Anthropic",
		apiUrl: "https://api.anthropic.com/v1",
		requiresApiKey: true,
		maxTokens: 200000,
		supportsStreaming: true,
		supportsVision: true,
		supportsAudio: false,
		authHeader: "x-api-key: {apiKey}",
		headers: {
			"anthropic-version": "2023-06-01"
		},
		models: [
			{
				id: "claude-3-5-sonnet-20241022",
				name: "Claude 3.5 Sonnet",
				description: "Most capable model for complex tasks",
				contextLength: 200000,
				supportsVision: true,
				supportsStreaming: true,
				pricing: { inputTokens: 3.0, outputTokens: 15.0 }
			},
			{
				id: "claude-3-5-haiku-20241022",
				name: "Claude 3.5 Haiku",
				description: "Fast and cost-effective model",
				contextLength: 200000,
				supportsVision: true,
				supportsStreaming: true,
				pricing: { inputTokens: 0.8, outputTokens: 4.0 }
			},
			{
				id: "claude-3-opus-20240229",
				name: "Claude 3 Opus",
				description: "Most powerful model for complex reasoning",
				contextLength: 200000,
				supportsVision: true,
				supportsStreaming: true,
				pricing: { inputTokens: 15.0, outputTokens: 75.0 }
			}
		],
		pricing: {
			inputTokens: 3.0,
			outputTokens: 15.0,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 1000,
			tokensPerMinute: 400000
		}
	},

	// OpenAI
	openai: {
		id: "openai",
		name: "OpenAI",
		description: "GPT models by OpenAI",
		apiUrl: "https://api.openai.com/v1",
		requiresApiKey: true,
		maxTokens: 128000,
		supportsStreaming: true,
		supportsVision: true,
		supportsAudio: true,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "gpt-4o",
				name: "GPT-4o",
				description: "Flagship multimodal model",
				contextLength: 128000,
				supportsVision: true,
				supportsAudio: true,
				supportsStreaming: true,
				pricing: { inputTokens: 2.5, outputTokens: 10.0 }
			},
			{
				id: "gpt-4o-mini",
				name: "GPT-4o Mini",
				description: "Affordable and intelligent small model",
				contextLength: 128000,
				supportsVision: true,
				supportsStreaming: true,
				pricing: { inputTokens: 0.15, outputTokens: 0.6 }
			},
			{
				id: "o1",
				name: "o1",
				description: "Reasoning model for complex problems",
				contextLength: 200000,
				supportsStreaming: false,
				pricing: { inputTokens: 15.0, outputTokens: 60.0 }
			},
			{
				id: "o1-mini",
				name: "o1-mini",
				description: "Faster reasoning model",
				contextLength: 128000,
				supportsStreaming: false,
				pricing: { inputTokens: 3.0, outputTokens: 12.0 }
			}
		],
		pricing: {
			inputTokens: 2.5,
			outputTokens: 10.0,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 500,
			tokensPerMinute: 800000
		}
	},

	// Google Gemini
	google: {
		id: "google",
		name: "Google AI",
		description: "Gemini models by Google",
		apiUrl: "https://generativelanguage.googleapis.com/v1beta",
		requiresApiKey: true,
		maxTokens: 1048576,
		supportsStreaming: true,
		supportsVision: true,
		supportsAudio: true,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "gemini-2.0-flash",
				name: "Gemini 2.0 Flash",
				description: "Fast multimodal model with 1M context",
				contextLength: 1048576,
				supportsVision: true,
				supportsAudio: true,
				supportsStreaming: true,
				pricing: { inputTokens: 0.075, outputTokens: 0.3 }
			},
			{
				id: "gemini-1.5-pro",
				name: "Gemini 1.5 Pro",
				description: "Advanced reasoning with long context",
				contextLength: 2097152,
				supportsVision: true,
				supportsAudio: true,
				supportsStreaming: true,
				pricing: { inputTokens: 1.25, outputTokens: 5.0 }
			},
			{
				id: "gemini-1.5-flash",
				name: "Gemini 1.5 Flash",
				description: "Fast and versatile model",
				contextLength: 1048576,
				supportsVision: true,
				supportsAudio: true,
				supportsStreaming: true,
				pricing: { inputTokens: 0.075, outputTokens: 0.3 }
			}
		],
		pricing: {
			inputTokens: 0.075,
			outputTokens: 0.3,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 1500,
			tokensPerMinute: 1000000
		}
	},

	// xAI Grok
	xai: {
		id: "xai",
		name: "xAI",
		description: "Grok models by xAI",
		apiUrl: "https://api.x.ai/v1",
		requiresApiKey: true,
		maxTokens: 131072,
		supportsStreaming: true,
		supportsVision: false,
		supportsAudio: false,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "grok-beta",
				name: "Grok Beta",
				description: "xAI's conversational AI with real-time data",
				contextLength: 131072,
				supportsStreaming: true,
				pricing: { inputTokens: 5.0, outputTokens: 15.0 }
			},
			{
				id: "grok-vision-beta",
				name: "Grok Vision Beta",
				description: "Grok with vision capabilities",
				contextLength: 131072,
				supportsVision: true,
				supportsStreaming: true,
				pricing: { inputTokens: 5.0, outputTokens: 15.0 }
			}
		],
		pricing: {
			inputTokens: 5.0,
			outputTokens: 15.0,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 60,
			tokensPerMinute: 300000
		}
	},

	// Chutes.ai
	chutes: {
		id: "chutes",
		name: "Chutes.ai",
		description: "Decentralized AI compute platform",
		apiUrl: "https://api.chutes.ai/v1",
		requiresApiKey: true,
		maxTokens: 128000,
		supportsStreaming: true,
		supportsVision: true,
		supportsAudio: false,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "deepseek-r1",
				name: "DeepSeek R1",
				description: "Reasoning model on decentralized compute",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.1, outputTokens: 0.2 }
			},
			{
				id: "llama-3.3-70b",
				name: "Llama 3.3 70B",
				description: "Meta's model on decentralized infrastructure",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.3, outputTokens: 0.5 }
			},
			{
				id: "qwen-2.5-72b",
				name: "Qwen 2.5 72B",
				description: "Alibaba's multilingual model",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.4, outputTokens: 0.6 }
			}
		],
		pricing: {
			inputTokens: 0.2,
			outputTokens: 0.4,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 100,
			tokensPerMinute: 500000
		}
	},

	// Groq
	groq: {
		id: "groq",
		name: "Groq",
		description: "Ultra-fast inference with GroqChip",
		apiUrl: "https://api.groq.com/openai/v1",
		requiresApiKey: true,
		maxTokens: 128000,
		supportsStreaming: true,
		supportsVision: false,
		supportsAudio: false,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "llama-3.3-70b-versatile",
				name: "Llama 3.3 70B",
				description: "Meta's model with ultra-fast inference",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.59, outputTokens: 0.79 }
			},
			{
				id: "mixtral-8x7b-32768",
				name: "Mixtral 8x7B",
				description: "Mistral's mixture of experts model",
				contextLength: 32768,
				supportsStreaming: true,
				pricing: { inputTokens: 0.24, outputTokens: 0.24 }
			},
			{
				id: "gemma2-9b-it",
				name: "Gemma 2 9B",
				description: "Google's efficient open model",
				contextLength: 8192,
				supportsStreaming: true,
				pricing: { inputTokens: 0.2, outputTokens: 0.2 }
			}
		],
		pricing: {
			inputTokens: 0.5,
			outputTokens: 0.5,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 30,
			tokensPerMinute: 6000
		}
	},

	// Together AI
	together: {
		id: "together",
		name: "Together AI",
		description: "Open-source models at scale",
		apiUrl: "https://api.together.xyz/v1",
		requiresApiKey: true,
		maxTokens: 128000,
		supportsStreaming: true,
		supportsVision: true,
		supportsAudio: false,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
				name: "Llama 3.1 70B Turbo",
				description: "Optimized version of Meta's flagship model",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.88, outputTokens: 0.88 }
			},
			{
				id: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
				name: "Llama 3.2 11B Vision",
				description: "Vision-capable Llama model",
				contextLength: 128000,
				supportsVision: true,
				supportsStreaming: true,
				pricing: { inputTokens: 0.18, outputTokens: 0.18 }
			},
			{
				id: "Qwen/Qwen2.5-72B-Instruct-Turbo",
				name: "Qwen 2.5 72B",
				description: "Alibaba's multilingual model",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0.8, outputTokens: 0.8 }
			}
		],
		pricing: {
			inputTokens: 0.6,
			outputTokens: 0.6,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 600,
			tokensPerMinute: 1000000
		}
	},

	// Local/Ollama
	local: {
		id: "local",
		name: "Local/Ollama",
		description: "Local models via Ollama or custom endpoint",
		apiUrl: "http://localhost:11434/v1",
		requiresApiKey: false,
		maxTokens: 131000,
		supportsStreaming: true,
		supportsVision: true,
		supportsAudio: false,
		authHeader: "Authorization: Bearer {apiKey}",
		models: [
			{
				id: "llama3.2",
				name: "Llama 3.2",
				description: "Meta's latest model running locally",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0, outputTokens: 0 }
			},
			{
				id: "qwen2.5",
				name: "Qwen 2.5",
				description: "Alibaba's model running locally",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0, outputTokens: 0 }
			},
			{
				id: "deepseek-r1",
				name: "DeepSeek R1",
				description: "Reasoning model running locally",
				contextLength: 128000,
				supportsStreaming: true,
				pricing: { inputTokens: 0, outputTokens: 0 }
			}
		],
		pricing: {
			inputTokens: 0,
			outputTokens: 0,
			currency: "USD"
		},
		rateLimit: {
			requestsPerMinute: 1000,
			tokensPerMinute: 10000000
		}
	}
};

// Helper functions
export function getProvider(providerId: string): Provider | undefined {
	return PROVIDERS[providerId];
}

export function getProviderModel(providerId: string, modelId: string): Model | undefined {
	const provider = getProvider(providerId);
	return provider?.models.find(model => model.id === modelId);
}

export function getAllProviders(): Provider[] {
	return Object.values(PROVIDERS);
}

export function getProvidersWithVision(): Provider[] {
	return getAllProviders().filter(provider => provider.supportsVision);
}

export function getProvidersWithAudio(): Provider[] {
	return getAllProviders().filter(provider => provider.supportsAudio);
}

export function getProvidersWithStreaming(): Provider[] {
	return getAllProviders().filter(provider => provider.supportsStreaming);
}

export function getFreeProviders(): Provider[] {
	return getAllProviders().filter(
		provider => !provider.requiresApiKey || provider.id === "local"
	);
}

export function formatAuthHeader(provider: Provider, apiKey: string): Record<string, string> {
	if (!provider.authHeader || !apiKey) {
		return {};
	}

	const authHeader = provider.authHeader.replace("{apiKey}", apiKey);
	const [headerName, headerValue] = authHeader.split(": ");

	const headers: Record<string, string> = {
		[headerName]: headerValue,
		"Content-Type": "application/json"
	};

	// Add any additional headers
	if (provider.headers) {
		Object.assign(headers, provider.headers);
	}

	return headers;
}

export function buildApiUrl(provider: Provider, endpoint = "/chat/completions"): string {
	return `${provider.apiUrl}${endpoint}`;
}

// Default provider fallback order
export const FALLBACK_PROVIDERS = ["openrouter", "chutes", "groq", "together", "local"];

export function getFallbackProviders(): string[] {
	return FALLBACK_PROVIDERS.filter(providerId => PROVIDERS[providerId]);
}
