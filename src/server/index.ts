import { staticPlugin } from "@elysiajs/static";
import { api } from "@server/helpers/api";
import { Config } from "@server/helpers/config";
import { onBeforeHandle, onError } from "@server/helpers/elysia";
import { plugins } from "@server/helpers/plugins";
import { Elysia } from "elysia";

const { PORT, HOST } = Config;

const app = new Elysia()
	.onError(c => onError(c))
	.onBeforeHandle(onBeforeHandle)
	.use(plugins)
	.use(api)
	.use(staticPlugin({ prefix: "/", noCache: true }))
	.listen(PORT, () => console.log(`Server listening on ${HOST}:${PORT}`));

export type App = typeof app;
