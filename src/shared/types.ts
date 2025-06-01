// import { SocketEvent } from "@shared/constants";

export interface Auth {
	preferred_username: string;
	picture: string;
	name: string;
	isLocalUse?: boolean;
}

export type TConfig = {
	PORT: number;
	HOST: string;
	IS_PROD: boolean;
	DEFAULT_APP: string;
	APPS_DIR: string;
};

export type TAppContext = {
	count: number;
	setCount: TReactStateSetter<number>;
};

// export type TClientToServerSocketEvent = {
// 	[SocketEvent.Hello]: (message: string) => void;
// };

// export type TServerToClientSocketEvent = {
// 	[SocketEvent.Hello]: ({ message }: { message: string }) => void;
// };

// export type TSocketReqParams<T extends keyof TClientToServerSocketEvent> = {
// 	event: T;
// 	data?: Parameters<TClientToServerSocketEvent[T]>;
// };

// export type TSocketResArgs<T extends keyof TClientToServerSocketEvent> = Parameters<
// 	TServerToClientSocketEvent[T]
// >;

export type TReactStateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

// Enhanced error types for better error handling
export enum ErrorCode {
	VALIDATION = "VALIDATION",
	NOT_FOUND = "NOT_FOUND",
	UNAUTHORIZED = "UNAUTHORIZED",
	FORBIDDEN = "FORBIDDEN",
	RATE_LIMITED = "RATE_LIMITED",
	INTERNAL_ERROR = "INTERNAL_ERROR",
	BAD_REQUEST = "BAD_REQUEST",
	CONFLICT = "CONFLICT",
	UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY"
}

export interface ApiError {
	code: ErrorCode;
	message: string;
	details?: unknown;
	timestamp: string;
	path?: string;
	requestId?: string;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: ApiError;
	timestamp: string;
	requestId?: string;
}

// Rate limiting types
export interface RateLimitInfo {
	limit: number;
	remaining: number;
	reset: number;
	retryAfter?: number;
}

// Logging types
export interface LogContext {
	requestId: string;
	method: string;
	path: string;
	ip?: string;
	userAgent?: string;
	timestamp: string;
	duration?: number;
	statusCode?: number;
	error?: unknown;
}

// Request context enhancement
export interface RequestContext {
	requestId: string;
	startTime: number;
	ip?: string;
	userAgent?: string;
	path: string;
	method: string;
}
