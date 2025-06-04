/**
 * Environment Variable Utilities for Bun + ElysiaJS
 *
 * This module provides type-safe environment variable access following Bun best practices.
 * Uses Bun.env instead of process.env to avoid build-time inlining security issues.
 *
 * @see https://bun.sh/docs/runtime/env
 * @see https://github.com/oven-sh/bun/issues/11191
 */

// Extend Bun's environment interface for autocompletion and type safety
declare module "bun" {
	interface Env {
		// Core application
		PORT?: string;
		HOST?: string;
		NODE_ENV?: string;

		// App configuration
		DEFAULT_APP?: string;
		APPS_DIR?: string;

		// Security & monitoring
		RATE_LIMIT_ENABLED?: string;
		SECURITY_LOG_LEVEL?: string;

		// AI & external services
		OPENAI_API_KEY?: string;
		ANTHROPIC_API_KEY?: string;
		HUGGINGFACE_API_KEY?: string;

		// Database (for future use)
		DATABASE_URL?: string;
		REDIS_URL?: string;

		// Deployment
		RAILWAY_ENVIRONMENT?: string;
		FLY_APP_NAME?: string;
		VERCEL_ENV?: string;
	}
}

/**
 * Type-safe environment variable getter with validation
 */
export function getEnv<T = string>(
	key: keyof typeof Bun.env,
	defaultValue?: T,
	transform?: (value: string) => T
): T {
	const value = Bun.env[key];

	if (value === undefined) {
		if (defaultValue !== undefined) {
			return defaultValue;
		}
		throw new Error(`Required environment variable ${String(key)} is not set`);
	}

	if (transform) {
		try {
			return transform(value);
		} catch (error) {
			throw new Error(`Failed to transform environment variable ${String(key)}: ${error}`);
		}
	}

	return value as T;
}

/**
 * Get environment variable as number
 */
export function getEnvNumber(key: keyof typeof Bun.env, defaultValue?: number): number {
	return getEnv(key, defaultValue, value => {
		const num = Number.parseInt(value, 10);
		if (Number.isNaN(num)) {
			throw new Error(`Expected number but got: ${value}`);
		}
		return num;
	});
}

/**
 * Get environment variable as boolean
 */
export function getEnvBoolean(key: keyof typeof Bun.env, defaultValue?: boolean): boolean {
	return getEnv(key, defaultValue, value => {
		const lower = value.toLowerCase();
		if (lower === "true" || lower === "1" || lower === "yes") return true;
		if (lower === "false" || lower === "0" || lower === "no") return false;
		throw new Error(`Expected boolean but got: ${value}`);
	});
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
	return Bun.env.NODE_ENV === "production";
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
	return Bun.env.NODE_ENV === "development" || Bun.env.NODE_ENV === undefined;
}

/**
 * Check if we're in test environment
 */
export function isTest(): boolean {
	return Bun.env.NODE_ENV === "test";
}

/**
 * Get all environment variables (for debugging)
 * Only use in development/debug scenarios
 */
export function getAllEnv(): Record<string, string | undefined> {
	if (isProduction()) {
		console.warn("⚠️ getAllEnv() called in production - this may expose sensitive data");
	}
	return { ...Bun.env };
}

/**
 * Validate required environment variables on startup
 */
export function validateRequiredEnv(requiredVars: (keyof typeof Bun.env)[]): void {
	const missing: string[] = [];

	for (const varName of requiredVars) {
		if (Bun.env[varName] === undefined) {
			missing.push(String(varName));
		}
	}

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}\nPlease check your .env file or environment configuration.`
		);
	}
}

/**
 * Environment configuration for the application
 */
export const env = {
	// Core app settings
	PORT: getEnvNumber("PORT", 3000),
	HOST: getEnv("HOST", "localhost"),
	NODE_ENV: getEnv("NODE_ENV", "development"),

	// App configuration
	DEFAULT_APP: getEnv("DEFAULT_APP", "vibesynq"),
	APPS_DIR: getEnv("APPS_DIR", "./public/apps"),

	// Feature flags
	RATE_LIMIT_ENABLED: getEnvBoolean("RATE_LIMIT_ENABLED", true),
	SECURITY_LOG_LEVEL: getEnv("SECURITY_LOG_LEVEL", "info"),

	// Computed values
	IS_PROD: isProduction(),
	IS_DEV: isDevelopment(),
	IS_TEST: isTest()
} as const;

// Export type for use in other modules
export type Environment = typeof env;
