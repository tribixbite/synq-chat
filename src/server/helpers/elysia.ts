import type { IncomingMessage, ServerResponse } from "node:http";
import { type Elysia, type ErrorHandler, type Handler, ValidationError } from "elysia";

import { ErrorMessage } from "../../shared/constants";

export const onError: ErrorHandler = ({ error, set }) => {
	if (error instanceof ValidationError) {
		set.status = 400;
		const message = error.all.map(e => e.summary).join(", ");
		return { message };
	}
	const message = "message" in error ? error.message : ErrorMessage.InternalServerError;
	return { message };
};

export const onBeforeHandle: Handler = c => {
	// Needed to prevent service worker error
	c.set.headers.vary = "Origin";
};

// Creates a Node-style HTTP adapter function (needed to attach Socket.IO to Elysia)
export const createHttpAdapter = (app: Elysia) => {
	return async (req: IncomingMessage, res: ServerResponse) => {
		try {
			const host = req.headers.host || "localhost";
			const url = new URL(req.url || "/", `http://${host}`);

			const request = new Request(url.toString(), {
				method: req.method || "GET",
				headers: req.headers as HeadersInit,
				body: ["GET", "HEAD"].includes(req.method || "")
					? undefined
					: (req as unknown as ReadableStream)
			});

			const response = await app.handle(request);
			const clonedResponse = response.clone();

			const headers: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				headers[key] = value;
			});

			res.writeHead(response.status, headers);

			if (clonedResponse.body) {
				const body = Buffer.from(await clonedResponse.arrayBuffer());
				res.end(body);
			} else {
				res.end();
			}
		} catch (error) {
			console.error("Error in HTTP adapter:");
			console.error(error);
			if (!res.headersSent) {
				res.writeHead(500, { "Content-Type": "text/plain" });
				res.end("Internal Server Error");
			} else {
				res.end();
			}
		}
	};
};
