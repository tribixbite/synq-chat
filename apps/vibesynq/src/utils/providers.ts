export interface Provider {
	name: string;
	max_tokens: number;
	id: string;
}

export interface Providers {
	[key: string]: Provider;
}

export const PROVIDERS: Providers = {
	local: {
		name: "Local",
		max_tokens: 131_000,
		id: "local"
	},
	openrouter: {
		name: "Open Router",
		max_tokens: 999_999,
		id: "openrouter"
	}
};
