import type { TConfig } from "@shared/types";

export const DefaultConfig: TConfig = {
	PORT: 3000,
	HOST: "http://localhost",
	IS_PROD: false,
	DEFAULT_APP: "",
	APPS_DIR: ""
};

export const Contact = {
	name: "Will Stone",
	email: "willstone@gmail.com",
	url: "https://www.willstone.net"
};

export enum Env {
	Production = "production",
	Development = "development"
}

export enum Path {
	Public = "public",
	ClientSrc = "src/client"
}

export enum SocketEvent {
	Connect = "connect",
	Hello = "hello"
}

export enum Route {
	Api = "/api",
	Hello = "/hello",
	Reference = "/reference"
}

export enum ErrorMessage {
	InternalServerError = "Internal Server Error"
}

export const STORED_STATE_PREFIX = "state";

export const WS_TIMEOUT_MS = 5000;

export const HASH_PREFIX = "~";

export const HASH_REGEX = new RegExp(`${HASH_PREFIX}.{8}\\.[a-zA-Z0-9]+$`);
