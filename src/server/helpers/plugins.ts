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
// This modifies the request path for llm subdomain requests to point to the llm subdirectory
const subdomainPlugin = new Elysia().onBeforeHandle(({ request, set }) => {
	const host = request.headers.get("host");

	// Check if this is the llm subdomain
	if (host?.startsWith("llm.")) {
		// Get the original URL
		const url = new URL(request.url);

		// Create a new URL with modified path - prefixing with /llm/
		// Handle the case where the path is just "/" by serving index.html
		const newPath = url.pathname === "/" ? "/llm/index.html" : `/llm${url.pathname}`;

		// Create a new URL with the modified path
		const newUrl = new URL(newPath, url.origin);
		newUrl.search = url.search;

		// Redirect to the new URL which will be handled by the static file plugin
		// No need to modify files on disk - just change the request URL
		set.redirect = newUrl.pathname + newUrl.search;
		return;
	}
});

export const plugins = new Elysia()
	.use(cors())
	.use(subdomainPlugin) // Add our subdomain handling plugin
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
