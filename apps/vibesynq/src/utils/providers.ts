// Re-export everything from the main providers file
export * from "../../../../src/utils/providers";

// Legacy interface for backward compatibility
export interface Provider {
	name: string;
	max_tokens: number;
	id: string;
}

export interface Providers {
	[key: string]: Provider;
}

// Import the new providers
import { PROVIDERS as NEW_PROVIDERS } from "../../../../src/utils/providers";

// Legacy format for backward compatibility
export const PROVIDERS: Providers = Object.fromEntries(
	Object.entries(NEW_PROVIDERS).map(([key, provider]) => [
		key,
		{
			name: provider.name,
			max_tokens: provider.maxTokens,
			id: provider.id
		}
	])
);
