import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";

import { Config, isCustomHost } from "@shared/config";
import { Contact, Route } from "@shared/constants";

import pkg from "../../../package.json";
const { description, license, name, version } = pkg;

const { HOST, PORT } = Config;

const WS_HOST = HOST.replace("http", "ws");

const connectSrc = isCustomHost ? ["'self'", `${HOST}:${PORT}`, `${WS_HOST}:${PORT}`] : ["*"];

export const rootPlugins = new Elysia()
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
