import { DefaultConfig, Env } from "@shared/constants";
import type { TConfig } from "@shared/types";

// Declare Bun environment interface for TypeScript autocompletion and type safety
declare module "bun" {
	interface Env {
		PORT?: string;
		HOST?: string;
		NODE_ENV?: string;
		DEFAULT_APP?: string;
		APPS_DIR?: string;
	}
}

// Environment detection and variable access
const isServer = typeof process !== "undefined";
const isBrowser = typeof window !== "undefined";

// Helper function to get environment variables
function getEnvVar(key: string): string | undefined {
	if (isServer) {
		return process.env[key];
	}
	if (isBrowser && typeof import.meta !== "undefined" && import.meta.env) {
		return import.meta.env[`VITE_${key}`] || import.meta.env[key];
	}
	return undefined;
}

// Use environment variables with fallbacks
const portEnv = getEnvVar("PORT");
const PORT = portEnv ? Number.parseInt(portEnv) : DefaultConfig.PORT;

const HOST = getEnvVar("HOST") ?? DefaultConfig.HOST;

const NODE_ENV = getEnvVar("NODE_ENV");
const IS_PROD =
	NODE_ENV === Env.Production || (isBrowser && import.meta.env?.MODE === Env.Production);

// App routing configuration
const DEFAULT_APP = getEnvVar("DEFAULT_APP") ?? "vibesynq";
const APPS_DIR = getEnvVar("APPS_DIR") ?? "./public/apps";

export const Config: TConfig = {
	PORT,
	HOST,
	IS_PROD,
	DEFAULT_APP,
	APPS_DIR
};

export const isCustomHost = HOST !== DefaultConfig.HOST;

// Available apps configuration
export const AVAILABLE_APPS = {
	admin: {
		name: "Admin",
		path: "admin",
		staticDir: `${APPS_DIR}/admin`,
		description: "Administrative interface"
	},
	vibesynq: {
		name: "VibeSynq",
		path: "vibesynq",
		staticDir: `${APPS_DIR}/vibesynq`,
		description: "AI app builder"
	},
	app1: {
		name: "App1",
		path: "app1",
		staticDir: `${APPS_DIR}/app1`,
		description: "Example app 1"
	},
	app2: {
		name: "App2",
		path: "app2",
		staticDir: `${APPS_DIR}/app2`,
		description: "Example app 2"
	}
} as const;

export type AppKey = keyof typeof AVAILABLE_APPS;
