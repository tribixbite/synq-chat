import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";

import { Config, isCustomHost } from "@server/helpers/config";
import { Contact, Route } from "@shared/constants";

import { description, license, name, version } from "package.json";

const { HOST, PORT } = Config;

const WS_HOST = HOST.replace("http", "ws");

const connectSrc = isCustomHost ? ["'self'", `${HOST}:${PORT}`, `${WS_HOST}:${PORT}`] : ["*"];

// Subdomain handler plugin
// This handles llm subdomain requests by directly serving files from the llm directory
const subdomainPlugin = new Elysia().onBeforeHandle(async ({ request, set }) => {
	const host = request.headers.get("host");

	// Check if this is the llm subdomain (supports both llm.localhost for dev and llm.synq.chat for prod)
	if (host?.startsWith("llm.")) {
		// Get the original URL
		const url = new URL(request.url);
		// For root path, serve index.html
		const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

		// Path doesn't include the /llm prefix since we're on the subdomain
		const filePath = `llm${pathname}`;

		try {
			// Try to read and serve the file directly
			const file = Bun.file(filePath);
			const exists = await file.exists();

			if (exists) {
				// File exists, serve it directly with appropriate content type
				return new Response(file);
			}

			// File doesn't exist, return 404 with custom message
			set.status = 404;
			return new Response(`File not found: ${pathname}`, { status: 404 });
		} catch (error) {
			// Error reading file, return 500
			console.error(`Error serving file from llm subdomain: ${error}`);
			set.status = 500;
			return new Response("Internal server error processing LLM subdomain request", {
				status: 500
			});
		}
	}
});

export const plugins = new Elysia()
	.use(cors())
	// .use(subdomainPlugin) // Add our subdomain handling plugin
	.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					baseUri: ["'self'"],
					childSrc: ["'self'"],
					connectSrc,
					defaultSrc: ["'self'"],
					fontSrc: ["'self'", "https:", "data:"],
					formAction: ["'self'"],
					frameAncestors: ["'self'"],
					imgSrc: ["'self'", "data:"],
					manifestSrc: ["'self'"],
					mediaSrc: ["'self'"],
					objectSrc: ["'none'"],
					scriptSrc: ["'self'"],
					scriptSrcAttr: ["'none'"],
					scriptSrcElem: [
						"'self'",
						"'sha256-TcUB1mzXiQO4GxpTRZ0EMpOXKMU3u+n/q1WrgVIcs1I='",
						"https://cdn.jsdelivr.net/npm/@scalar/"
					],
					styleSrc: ["'self'"],
					styleSrcAttr: ["'self'", "'unsafe-inline'"],
					styleSrcElem: ["'self'", "'unsafe-inline'"],
					upgradeInsecureRequests: [],
					workerSrc: ["'self'"]
				}
			}
		})
	)
	.use(
		swagger({
			path: `${Route.Api}${Route.Reference}`,
			documentation: {
				info: {
					title: name,
					version,
					description,
					contact: Contact,
					license: { name: license }
				}
			}
		})
	);
