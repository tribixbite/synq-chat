import { type ErrorHandler, type Handler, ValidationError as ElysiaValidationError } from "elysia";

import { ErrorMessage } from "../../shared/constants";
import {
	BaseApiError,
	InternalServerError,
	RateLimitError,
	ValidationError
} from "../../shared/errors";
import type { ApiResponse, RequestContext } from "../../shared/types";
import { ErrorCode } from "../../shared/types";

// Helper function to generate request ID (now simplified since logixlysia handles request tracking)
function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error handler with structured logging and proper error responses
export const onError: ErrorHandler = ({ error, set, request, path }) => {
	const requestId = generateRequestId();
	const context = {
		requestId,
		method: request.method,
		path: path || new URL(request.url).pathname,
		timestamp: new Date().toISOString()
	};

	// Handle Elysia validation errors
	if (error instanceof ElysiaValidationError) {
		const validationError = new ValidationError("Validation failed", {
			errors: error.all.map(e => ({
				path: "path" in e ? e.path : "unknown",
				message: e.summary || "Validation failed"
			}))
		});

		set.status = validationError.statusCode;
		set.headers["Content-Type"] = "application/json";

		// Simple console error since logixlysia handles detailed logging
		console.warn("[VALIDATION]", validationError.message, context);

		const response: ApiResponse = {
			success: false,
			error: {
				code: validationError.code,
				message: validationError.message,
				details: validationError.details,
				timestamp: validationError.timestamp,
				path: context.path,
				requestId
			},
			timestamp: new Date().toISOString(),
			requestId
		};

		return response;
	}

	// Handle custom API errors
	if (error instanceof BaseApiError) {
		set.status = error.statusCode;
		set.headers["Content-Type"] = "application/json";

		// Add rate limit headers for rate limit errors
		if (error instanceof RateLimitError) {
			set.headers["Retry-After"] = error.retryAfter.toString();
			set.headers["X-RateLimit-Reset"] = (Date.now() + error.retryAfter * 1000).toString();

			// Simple console error since logixlysia handles detailed logging
			console.warn("[RATE_LIMIT]", error.message, context);
		} else {
			console.error("[API_ERROR]", error.message, context);
		}

		const response: ApiResponse = {
			success: false,
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
				timestamp: error.timestamp,
				path: context.path,
				requestId
			},
			timestamp: new Date().toISOString(),
			requestId
		};

		return response;
	}

	// Handle unknown errors
	const internalError = new InternalServerError(
		"message" in error ? error.message : ErrorMessage.InternalServerError,
		{ originalError: error.constructor.name }
	);

	set.status = internalError.statusCode;
	set.headers["Content-Type"] = "application/json";

	console.error("[INTERNAL_ERROR]", internalError.message, context, {
		stack: (error as Error).stack
	});

	const response: ApiResponse = {
		success: false,
		error: {
			code: ErrorCode.INTERNAL_ERROR,
			message: "Internal Server Error",
			timestamp: internalError.timestamp,
			path: context.path,
			requestId
		},
		timestamp: new Date().toISOString(),
		requestId
	};

	return response;
};

// Enhanced request handler with context and security headers (logixlysia handles request logging)
export const onBeforeHandle: Handler = ({ request, set, server }) => {
	const requestId = generateRequestId();
	const startTime = Date.now();
	const url = new URL(request.url);
	const ip = server?.requestIP(request)?.address || undefined;
	const userAgent = request.headers.get("user-agent") || undefined;

	// Add request context to set for use in other handlers
	const requestContext: RequestContext = {
		requestId,
		startTime,
		ip,
		userAgent,
		path: url.pathname,
		method: request.method
	};

	// Store context in headers for downstream access
	set.headers["X-Request-ID"] = requestId;

	// Add CORS and security headers
	set.headers.vary = "Origin";
	set.headers["X-Content-Type-Options"] = "nosniff";
	set.headers["X-Frame-Options"] = "DENY";
	set.headers["X-XSS-Protection"] = "1; mode=block";

	// Store context in a way that can be accessed by other handlers
	(request as unknown as Record<string, unknown>).__context = requestContext;
};

// Response handler for performance tracking (logixlysia handles response logging)
export const onAfterHandle: Handler = ({ request, set }) => {
	const context = (request as unknown as Record<string, unknown>).__context as RequestContext;
	if (!context) return;

	const duration = Date.now() - context.startTime;
	const statusCode = set.status || 200;

	// Add performance headers
	set.headers["X-Response-Time"] = `${duration}ms`;

	// Log slow requests directly to console (logixlysia handles regular requests)
	if (duration > 2000) {
		console.warn("[SLOW_REQUEST]", `${context.method} ${context.path} took ${duration}ms`, {
			requestId: context.requestId,
			statusCode: typeof statusCode === "number" ? statusCode : 200
		});
	}
};
