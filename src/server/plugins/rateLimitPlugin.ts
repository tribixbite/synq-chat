import Elysia from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { RateLimitError } from "../../shared/errors";

// Type definition for server parameter in generator function
type ServerLike = {
	requestIP?(request: Request): { address: string } | null;
} | null;

// Rate limiting configuration with best practices from elysia-rate-limit documentation
const rateLimitConfigs = {
	// General API rate limit - 60 requests per minute
	general: {
		duration: 60000, // 1 minute in milliseconds
		max: 60,
		scoping: "global" as const,
		headers: true,
		errorResponse: new RateLimitError("Too many requests, please try again later", 60),
		skip: (request: Request) => {
			const url = new URL(request.url);
			// Skip rate limiting for static assets using path patterns
			return (
				url.pathname.startsWith("/assets/") ||
				url.pathname.startsWith("/public/") ||
				url.pathname.endsWith(".css") ||
				url.pathname.endsWith(".js") ||
				url.pathname.endsWith(".ico") ||
				url.pathname.endsWith(".png") ||
				url.pathname.endsWith(".jpg") ||
				url.pathname.endsWith(".svg") ||
				url.pathname.endsWith(".gif") ||
				url.pathname.endsWith(".woff") ||
				url.pathname.endsWith(".woff2") ||
				url.pathname.endsWith(".ttf") ||
				url.pathname.endsWith(".eot")
			);
		},
		generator: (request: Request, server: ServerLike) => {
			// Smart IP detection with proxy support following best practices
			const realIp = request.headers.get("x-real-ip");
			const forwarded = request.headers.get("x-forwarded-for");
			const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare support
			const directIp = server?.requestIP?.(request)?.address;

			// Priority: Real-IP > CF-Connecting-IP > X-Forwarded-For (first) > Direct IP
			return (
				realIp ||
				cfConnectingIp ||
				(forwarded ? forwarded.split(",")[0].trim() : null) ||
				directIp ||
				"unknown"
			);
		}
	},

	// Strict rate limit for AI/API endpoints - 10 requests per minute
	strict: {
		duration: 60000,
		max: 10,
		scoping: "global" as const,
		headers: true,
		errorResponse: new RateLimitError("AI API rate limit exceeded, please try again later", 60),
		generator: (request: Request, server: ServerLike) => {
			const realIp = request.headers.get("x-real-ip");
			const forwarded = request.headers.get("x-forwarded-for");
			const cfConnectingIp = request.headers.get("cf-connecting-ip");
			const directIp = server?.requestIP?.(request)?.address;

			return (
				realIp ||
				cfConnectingIp ||
				(forwarded ? forwarded.split(",")[0].trim() : null) ||
				directIp ||
				"unknown"
			);
		}
	},

	// Very strict rate limit for authentication endpoints - 5 attempts per 5 minutes
	auth: {
		duration: 300000, // 5 minutes in milliseconds
		max: 5,
		scoping: "global" as const,
		headers: true,
		errorResponse: new RateLimitError(
			"Too many authentication attempts, please try again later",
			300
		),
		generator: (request: Request, server: ServerLike) => {
			const realIp = request.headers.get("x-real-ip");
			const forwarded = request.headers.get("x-forwarded-for");
			const cfConnectingIp = request.headers.get("cf-connecting-ip");
			const directIp = server?.requestIP?.(request)?.address;

			return (
				realIp ||
				cfConnectingIp ||
				(forwarded ? forwarded.split(",")[0].trim() : null) ||
				directIp ||
				"unknown"
			);
		}
	}
};

// Rate limiting plugins using modern elysia-rate-limit syntax
export const generalRateLimit = new Elysia({ name: "generalRateLimit" })
	.use(rateLimit(rateLimitConfigs.general))
	.onError(({ error, request }) => {
		if (error instanceof RateLimitError) {
			const url = new URL(request.url);
			console.warn("[RATE_LIMIT] General rate limit exceeded", {
				method: request.method,
				path: url.pathname,
				timestamp: new Date().toISOString(),
				userAgent: request.headers.get("user-agent") || "unknown"
			});
		}
	});

export const strictRateLimit = new Elysia({ name: "strictRateLimit" })
	.use(rateLimit(rateLimitConfigs.strict))
	.onError(({ error, request }) => {
		if (error instanceof RateLimitError) {
			const url = new URL(request.url);
			console.warn("[RATE_LIMIT] Strict rate limit exceeded", {
				method: request.method,
				path: url.pathname,
				timestamp: new Date().toISOString(),
				userAgent: request.headers.get("user-agent") || "unknown"
			});
		}
	});

export const authRateLimit = new Elysia({ name: "authRateLimit" })
	.use(rateLimit(rateLimitConfigs.auth))
	.onError(({ error, request }) => {
		if (error instanceof RateLimitError) {
			const url = new URL(request.url);
			console.warn("[RATE_LIMIT] Auth rate limit exceeded", {
				method: request.method,
				path: url.pathname,
				timestamp: new Date().toISOString(),
				userAgent: request.headers.get("user-agent") || "unknown"
			});
		}
	});

// Rate limit status endpoint to monitor current limits
export const rateLimitStatus = new Elysia({ name: "rateLimitStatus" }).get(
	"/rate-limit-status",
	({ headers }) => {
		const remaining = headers["x-ratelimit-remaining"];
		const limit = headers["x-ratelimit-limit"];
		const reset = headers["x-ratelimit-reset"];

		return {
			success: true,
			rateLimit: {
				limit: limit ? Number.parseInt(limit as string) : null,
				remaining: remaining ? Number.parseInt(remaining as string) : null,
				reset: reset ? Number.parseInt(reset as string) : null,
				resetTime: reset
					? new Date(Number.parseInt(reset as string) * 1000).toISOString()
					: null
			},
			timestamp: new Date().toISOString()
		};
	}
);

// Export configuration for reference
export { rateLimitConfigs };
