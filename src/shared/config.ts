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

// Use process.env instead of process.env for better security and Bun compatibility
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : DefaultConfig.PORT;

const HOST = process.env.HOST ?? DefaultConfig.HOST;

const IS_PROD = process.env.NODE_ENV === Env.Production;

// App routing configuration
const DEFAULT_APP = process.env.DEFAULT_APP ?? "vibesynq";
const APPS_DIR = process.env.APPS_DIR ?? "./public/apps";

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
