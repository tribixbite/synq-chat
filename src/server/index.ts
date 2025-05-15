import { staticPlugin } from "@elysiajs/static";
import { api } from "@helpers/api";
import { onBeforeHandle, onError } from "@helpers/elysia";
import { plugins } from "@helpers/plugins";
import { Config } from "@shared/config";
import { type Context, Elysia } from "elysia";

const { PORT, HOST } = Config;

// Define an interface for the request object with a potential subdomain
interface CustomRequest extends Request {
	subdomain?: string;
}

const app = new Elysia()
	.onError(c => onError(c))
	.onBeforeHandle(onBeforeHandle)
	.use(plugins)
	.use(api)
	// Serve vibesynq static files
	.use(
		staticPlugin({
			prefix: "/vibesynq",
			assets: "./apps/vibesynq/public",
			alwaysStatic: true,
			indexHTML: true
		})
	)
	// Serve admin static files
	.use(
		staticPlugin({
			prefix: "/admin",
			assets: "./apps/admin/public",
			alwaysStatic: true,
			indexHTML: true
		})
	)
	// Serve root public static files (e.g., favicons, manifests if any)
	.use(
		staticPlugin({
			prefix: "/",
			assets: "./public",
			alwaysStatic: true,
			noCache: true // Good for development for root assets like favicon
		})
	)
	// Add subdomain to context
	.derive(({ request }) => {
		const host = request.headers.get("host") || "";
		return {
			subdomain: host.split(".")[0]
		};
	})
	// Handle root path and subdomain routing
	.get("/", (context: Context & { subdomain: string }) => {
		const { set, subdomain } = context; // Type assertion for derived context

		if (subdomain === "vibesynq") {
			set.redirect = "/vibesynq/";
			return;
		}
		if (subdomain === "admin") {
			set.redirect = "/admin/";
			return;
		}
		// Default to vibesynq
		set.redirect = "/vibesynq/";
	})
	.listen(PORT, () => console.log(`Server listening on ${HOST}:${PORT}`));

export type App = typeof app;
