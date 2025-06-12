import { Config } from "@shared/config";
import logixlysia from "logixlysia";

const errorNotificationTransport = {
	log: async (level: string, message: string, meta: Record<string, unknown>) => {
		// Only send notifications for errors and critical warnings
		if (
			level === "ERROR" ||
			(level === "WARNING" && typeof meta?.status === "number" && meta.status >= 500)
		) {
			// In production, you could send to Slack, Discord, or email
			console.error(`🚨 CRITICAL: [${level}] ${message}`, meta);
		}
	}
};
export const logger = logixlysia({
	config: {
		// Startup configuration
		showStartupMessage: true,
		startupMessageFormat: Config.IS_PROD ? "simple" : "banner",

		// Timestamp configuration
		timestamp: {
			translateTime: "yyyy-mm-dd HH:MM:ss"
		},

		// IP tracking enabled
		ip: true,

		// File logging
		// logFilePath: "./logs/access.log",

		// Custom log format with available placeholders
		customLogFormat:
			"🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}",

		// Smart filtering based on environment
		logFilter: Config.IS_PROD
			? {
					// Production: Only log warnings, errors, and important status codes
					level: ["WARNING", "ERROR"],
					status: [400, 401, 403, 404, 429, 500, 502, 503, 504]
				}
			: {
					// Development: Log everything for debugging
					level: ["INFO", "WARNING", "ERROR"],
					method: ["GET", "POST", "PUT", "DELETE", "PATCH"]
				}

		// Custom transports for error notifications and file logging
		// transports: Config.IS_PROD
		// 	? [
		// 			errorNotificationTransport,
		// 			// File transport for errors only
		// 			{
		// 				log: async (
		// 					level: string,
		// 					message: string,
		// 					meta: Record<string, unknown>
		// 				) => {
		// 					if (level === "ERROR") {
		// 						const errorLog = `${new Date().toISOString()} [ERROR] ${message} ${JSON.stringify(meta)}\n`;
		// 						await Bun.write("./logs/errors.log", errorLog, {
		// 							createPath: true
		// 						});
		// 					}
		// 				}
		// 			}
		// 		]
		// 	: [
		// 			// Development: just console output (default)
		// 		]
	}
});
