import { staticPlugin } from "@elysiajs/static";
import { type Context, Elysia } from "elysia";
import { llmApp, vibesynq } from "./vibesynq";

const Config = {
	PORT: Number.parseInt(process.env.APP_PORT || "3000"),
	HOST: process.env.HOST || "0.0.0.0"
};

// More specific type for the onError handler context parameters
const onErrorCustom = ({
	code,
	error,
	set,
	request
}: {
	code: string; // Or a more specific Elysia error code type if available/needed
	error: Error;
	set: Context["set"];
	request: Context["request"];
}) => {
	console.error(`Error Code: ${code}, Path: ${request.url}, Details: ${error.message}`);

	let httpStatus: number;
	switch (code) {
		case "NOT_FOUND":
			httpStatus = 404;
			break;
		case "VALIDATION":
			httpStatus = 400;
			break;
		default:
			httpStatus = 500;
			break;
	}
	set.status = httpStatus;
	const message = error.message || error.toString() || code;
	return new Response(message, { status: httpStatus });
};

const onBeforeHandle = (context: Context) => {
	console.log(`Incoming request: ${context.request.method} ${context.request.url}`);
};

const app = new Elysia()
	.onError(context => {
		// context.code is a number, not a string
		const { code, error, set, request } = context as unknown as {
			code: number;
			error: Error;
			set: Context["set"];
			request: Context["request"];
		};
		console.error(`Error Code: ${code}, Path: ${request.url}, Details: ${error.message}`);

		let httpStatus: number;
		switch (code) {
			case 404:
				httpStatus = 404;
				break;
			case 400:
				httpStatus = 400;
				break;
			default:
				httpStatus = 500;
				break;
		}
		set.status = httpStatus;
		const message = error.message || error.toString() || String(code);
		return new Response(message, { status: httpStatus });
	})
	.onBeforeHandle(onBeforeHandle)

	// Mount the llmApp. It has its own host-based guard.
	.use(llmApp)

	// Mount the vibesynq app. It is prefixed with /vibesynq.
	.use(vibesynq)

	// Serve admin static files
	.use(
		staticPlugin({
			prefix: "/admin",
			assets: "./apps/admin/public",
			alwaysStatic: true,
			indexHTML: true
		})
	)

	// Handle root path and other subdomains
	.get("/", ({ request, set }: Context) => {
		const host = request.headers.get("host") || "";

		if (host.startsWith("admin.")) {
			set.redirect = "/admin/";
			return;
		}

		if (!host.startsWith("llm.")) {
			set.redirect = "/vibesynq/";
			return;
		}
		set.status = 404;
		return "Resource not found on LLM subdomain.";
	})

	.listen(Config.PORT, () => console.log(`🦊 Server listening on ${Config.HOST}:${Config.PORT}`));

export type App = typeof app;
