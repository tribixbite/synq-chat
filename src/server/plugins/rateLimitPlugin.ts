import Elysia from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { RateLimitError } from "../../shared/errors";

// Type for elysia-rate-limit generator function - matches the expected signature
type RateLimitGenerator = (request: Request, server: unknown) => string;

// Security configuration - expandable blocked IP list
const BLOCKED_IPS = new Set([
	"52.164.122.222", // Known attacker from logs
	"182.44.8.254", // Known attacker from logs
	"185.247.137.231" // Additional attacker from logs
	// Add more IPs as needed
]);

// Comprehensive attack pattern detection
const SECURITY_PATTERNS = {
	wordpress: [
		"/wp-admin/",
		"/wp-includes/",
		"/wp-content/",
		"/wp-login.php",
		"/wp-config.php",
		"/function.php",
		"/date.php",
		"/PHPMailer/",
		"/xmlrpc.php",
		"/wp-cron.php",
		"/wp-json/",
		"/wp-api/"
	],
	admin: [
		"/admin/",
		"/administrator/",
		"/wp-admin/",
		"/phpmyadmin/",
		"/cpanel/",
		"/cPanel/",
		"/webmail/",
		"/panel/"
	],
	exploits: [
		"/.well-known/",
		"/.env",
		"/config.php",
		"/database.php",
		"/backup/",
		"/sql/",
		"/dump/",
		"/phpinfo.php"
	],
	bots: ["/robots.txt", "/sitemap.xml", "/.htaccess", "/web.config"]
};

// Trusted static file extensions that should bypass rate limiting
const STATIC_EXTENSIONS = new Set([
	".css",
	".js",
	".ico",
	".png",
	".jpg",
	".jpeg",
	".gif",
	".svg",
	".woff",
	".woff2",
	".ttf",
	".eot",
	".webp",
	".avif",
	".mp4",
	".mp3",
	".webm",
	".pdf",
	".zip"
]);

// Helper function to extract real IP with enhanced proxy support
function getRealIP(request: Request, server?: unknown): string {
	// Priority order for IP detection
	const realIp = request.headers.get("x-real-ip");
	const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
	const forwarded = request.headers.get("x-forwarded-for");

	// Try to extract IP from server if available and has requestIP method
	let directIp: string | undefined;
	if (server && typeof server === "object" && server !== null && "requestIP" in server) {
		const serverObj = server as {
			requestIP?: (request: Request) => { address: string } | null;
		};
		const result = serverObj.requestIP?.(request);
		directIp = result?.address;
	}

	return (
		realIp ||
		cfConnectingIp ||
		(forwarded ? forwarded.split(",")[0].trim() : null) ||
		directIp ||
		"unknown"
	);
}

// Enhanced security threat detection
function detectSecurityThreats(
	request: Request,
	server?: unknown
): {
	shouldBlock: boolean;
	threatType?: string;
	severity: "low" | "medium" | "high";
} {
	const url = new URL(request.url);
	const pathname = url.pathname.toLowerCase();
	const ip = getRealIP(request, server);
	const userAgent = request.headers.get("user-agent") || "";

	// Check blocked IPs first (highest priority)
	if (BLOCKED_IPS.has(ip)) {
		return {
			shouldBlock: true,
			threatType: "blocked_ip",
			severity: "high"
		};
	}

	// Check for WordPress attacks
	if (SECURITY_PATTERNS.wordpress.some(pattern => pathname.includes(pattern.toLowerCase()))) {
		// Auto-add IP to blocklist for WordPress attacks
		BLOCKED_IPS.add(ip);
		return {
			shouldBlock: true,
			threatType: "wordpress_attack",
			severity: "high"
		};
	}

	// Check for admin panel attacks
	if (SECURITY_PATTERNS.admin.some(pattern => pathname.includes(pattern.toLowerCase()))) {
		return {
			shouldBlock: true,
			threatType: "admin_attack",
			severity: "medium"
		};
	}

	// Check for exploit attempts
	if (SECURITY_PATTERNS.exploits.some(pattern => pathname.includes(pattern.toLowerCase()))) {
		return {
			shouldBlock: true,
			threatType: "exploit_attempt",
			severity: "high"
		};
	}

	// Suspicious user agents
	const suspiciousAgents = ["sqlmap", "nikto", "nmap", "masscan", "zgrab"];
	if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
		BLOCKED_IPS.add(ip);
		return {
			shouldBlock: true,
			threatType: "malicious_scanner",
			severity: "high"
		};
	}

	return { shouldBlock: false, severity: "low" };
}

// Enhanced IP blocking middleware with comprehensive logging
export const ipBlockingMiddleware = new Elysia({ name: "ipBlocking" }).onBeforeHandle(
	({ request, server }) => {
		const threat = detectSecurityThreats(request, server);

		if (threat.shouldBlock) {
			const ip = getRealIP(request, server);
			const url = new URL(request.url);

			// Comprehensive security logging
			console.warn(`🚨 [SECURITY] ${threat.threatType?.toUpperCase()} BLOCKED`, {
				ip,
				path: url.pathname,
				method: request.method,
				threatType: threat.threatType,
				severity: threat.severity,
				userAgent: request.headers.get("user-agent"),
				referer: request.headers.get("referer"),
				timestamp: new Date().toISOString(),
				blockedIPsCount: BLOCKED_IPS.size
			});

			// Return structured error response
			return new Response(
				JSON.stringify({
					success: false,
					error: {
						code: "SECURITY_VIOLATION",
						message: "Access denied due to security policy",
						threatType: threat.threatType,
						timestamp: new Date().toISOString(),
						requestId: crypto.randomUUID()
					}
				}),
				{
					status: 403,
					headers: {
						"Content-Type": "application/json",
						"X-Security-Block": threat.threatType || "unknown",
						"X-Block-Severity": threat.severity,
						"X-Request-ID": crypto.randomUUID()
					}
				}
			);
		}
	}
);

// Smart static file detection
function isStaticFile(pathname: string): boolean {
	// Check for static file extensions
	const extension = pathname.substring(pathname.lastIndexOf("."));
	if (STATIC_EXTENSIONS.has(extension.toLowerCase())) {
		return true;
	}

	// Check for common static paths
	const staticPaths = ["/assets/", "/static/", "/public/", "/images/", "/css/", "/js/"];
	return staticPaths.some(path => pathname.startsWith(path));
}

// Generator function that matches elysia-rate-limit expectations
const createIPGenerator = (): RateLimitGenerator => {
	return (request: Request, server: unknown): string => {
		return getRealIP(request, server);
	};
};

// Enhanced rate limiting configurations with smart detection
const rateLimitConfigs = {
	// General API rate limit - 100 requests per minute for normal users
	general: {
		duration: 60000,
		max: 100,
		scoping: "global" as const,
		headers: true,
		errorResponse: new RateLimitError("Rate limit exceeded. Please try again later.", 60),
		skip: (request: Request) => {
			const url = new URL(request.url);
			return isStaticFile(url.pathname);
		},
		generator: createIPGenerator()
	},

	// Strict rate limit for AI/API endpoints - 15 requests per minute
	strict: {
		duration: 60000,
		max: 15,
		scoping: "global" as const,
		headers: true,
		errorResponse: new RateLimitError(
			"AI API rate limit exceeded. Please wait before making more requests.",
			60
		),
		generator: createIPGenerator()
	},

	// Very strict rate limit for authentication - 5 attempts per 5 minutes
	auth: {
		duration: 300000,
		max: 5,
		scoping: "global" as const,
		headers: true,
		errorResponse: new RateLimitError(
			"Too many authentication attempts. Please wait 5 minutes.",
			300
		),
		generator: createIPGenerator()
	},

	// Ultra-strict for suspicious activity - 3 requests per 10 minutes
	suspicious: {
		duration: 600000,
		max: 3,
		scoping: "global" as const,
		headers: true,
		errorResponse: new RateLimitError("Suspicious activity detected. Access restricted.", 600),
		generator: createIPGenerator()
	}
};

// Enhanced rate limiting plugins with proper error handling
export const generalRateLimit = new Elysia({ name: "generalRateLimit" })
	.use(rateLimit(rateLimitConfigs.general))
	.onError(({ error, request }) => {
		if (error instanceof RateLimitError) {
			const url = new URL(request.url);
			const ip = getRealIP(request);

			console.warn("⚡ [RATE_LIMIT] General limit exceeded", {
				ip,
				method: request.method,
				path: url.pathname,
				userAgent: request.headers.get("user-agent"),
				timestamp: new Date().toISOString()
			});
		}
	});

export const strictRateLimit = new Elysia({ name: "strictRateLimit" })
	.use(rateLimit(rateLimitConfigs.strict))
	.onError(({ error, request }) => {
		if (error instanceof RateLimitError) {
			const url = new URL(request.url);
			const ip = getRealIP(request);

			console.warn("🔥 [RATE_LIMIT] Strict AI limit exceeded", {
				ip,
				method: request.method,
				path: url.pathname,
				timestamp: new Date().toISOString()
			});
		}
	});

export const authRateLimit = new Elysia({ name: "authRateLimit" })
	.use(rateLimit(rateLimitConfigs.auth))
	.onError(({ error, request }) => {
		if (error instanceof RateLimitError) {
			const url = new URL(request.url);
			const ip = getRealIP(request);

			console.warn("🔐 [RATE_LIMIT] Auth limit exceeded", {
				ip,
				method: request.method,
				path: url.pathname,
				timestamp: new Date().toISOString()
			});
		}
	});

export const suspiciousRateLimit = new Elysia({ name: "suspiciousRateLimit" })
	.use(rateLimit(rateLimitConfigs.suspicious))
	.onError(({ error, request }) => {
		if (error instanceof RateLimitError) {
			const url = new URL(request.url);
			const ip = getRealIP(request);

			console.error("🚨 [RATE_LIMIT] Suspicious activity limit exceeded", {
				ip,
				method: request.method,
				path: url.pathname,
				timestamp: new Date().toISOString()
			});
		}
	});

// Enhanced rate limit status endpoint with comprehensive monitoring
export const rateLimitStatus = new Elysia({ name: "rateLimitStatus" })
	.get("/rate-limit-status", ({ headers }) => {
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
			security: {
				blockedIPs: Array.from(BLOCKED_IPS),
				blockedIPsCount: BLOCKED_IPS.size,
				securityPatterns: Object.keys(SECURITY_PATTERNS).length,
				staticExtensions: Array.from(STATIC_EXTENSIONS)
			},
			configs: Object.keys(rateLimitConfigs),
			timestamp: new Date().toISOString()
		};
	})
	.get("/security-status", () => {
		return {
			success: true,
			security: {
				blockedIPs: Array.from(BLOCKED_IPS).slice(0, 10), // Show first 10 for security
				totalBlockedIPs: BLOCKED_IPS.size,
				threatCategories: Object.keys(SECURITY_PATTERNS),
				lastUpdated: new Date().toISOString()
			}
		};
	});

// Utility functions for manual IP management
export const securityUtils = {
	addBlockedIP: (ip: string) => {
		BLOCKED_IPS.add(ip);
		console.warn(`🚫 [SECURITY] Manually added IP to blocklist: ${ip}`);
	},

	removeBlockedIP: (ip: string) => {
		const removed = BLOCKED_IPS.delete(ip);
		if (removed) {
			console.info(`✅ [SECURITY] Removed IP from blocklist: ${ip}`);
		}
		return removed;
	},

	isBlocked: (ip: string) => BLOCKED_IPS.has(ip),

	getBlockedCount: () => BLOCKED_IPS.size,

	clearBlockedIPs: () => {
		const count = BLOCKED_IPS.size;
		BLOCKED_IPS.clear();
		console.warn(`🧹 [SECURITY] Cleared ${count} IPs from blocklist`);
		return count;
	}
};

// Export all configurations and utilities
export {
	BLOCKED_IPS,
	detectSecurityThreats,
	getRealIP,
	isStaticFile,
	rateLimitConfigs,
	SECURITY_PATTERNS,
	STATIC_EXTENSIONS
};
