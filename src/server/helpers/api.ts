import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Elysia, t } from "elysia";

import { Route } from "@shared/constants";

export type TApi = typeof api;

export const api = new Elysia({ prefix: Route.Api })
	.get(
		Route.Hello,
		c => {
			const { name } = c.query;
			return {
				message: `hello ${name || "from bun"}!`
			};
		},
		{
			query: t.Object({
				name: t.Optional(t.String())
			}),
			response: {
				200: t.Object({ message: t.String() }),
				500: t.Object({ message: t.String() })
			}
		}
	)
	.post(
		Route.Hello,
		c => {
			const { name } = c.body;
			return {
				message: `hello ${name || "from bun"}!`
			};
		},
		{
			body: t.Object({ name: t.String() }),
			response: {
				200: t.Object({ message: t.String() }),
				400: t.Object({ message: t.String() }),
				500: t.Object({ message: t.String() })
			}
		}
	)
	.group("/admin", app =>
		app
			// List files in a directory
			.get(
				"/files",
				async ({ query }) => {
					const dir = query.dir || "";
					const basePath = "public";
					const targetPath = join(basePath, dir);

					// Don't allow directory traversal
					if (!targetPath.startsWith(basePath)) {
						return { error: "Invalid directory path" };
					}

					try {
						// Ensure the directory exists
						if (!existsSync(targetPath)) {
							await mkdir(targetPath, { recursive: true });
						}

						// Read the directory
						const files = await readdir(targetPath, { withFileTypes: true });

						// Format the results
						const result = files.map(file => ({
							name: file.name,
							isDirectory: file.isDirectory(),
							path: join(dir, file.name).replace(/\\/g, "/")
						}));

						return { files: result, currentDir: dir };
					} catch (error) {
						console.error(`Error listing files: ${error}`);
						const errorMessage = error instanceof Error ? error.message : String(error);
						return { error: `Failed to list files: ${errorMessage}` };
					}
				},
				{
					query: t.Object({
						dir: t.Optional(t.String())
					})
				}
			)

			// Upload file endpoint
			.post(
				"/upload",
				async ({ body, query }) => {
					const { file, content } = body;
					const dir = query.dir || "";
					const basePath = "public";
					const targetDir = join(basePath, dir);
					const targetPath = join(targetDir, file);

					// Don't allow directory traversal
					if (!targetPath.startsWith(basePath)) {
						return { error: "Invalid file path" };
					}

					try {
						// Ensure the target directory exists
						if (!existsSync(targetDir)) {
							await mkdir(targetDir, { recursive: true });
						}

						// Write the file
						await writeFile(targetPath, content);

						return { success: true, path: join(dir, file).replace(/\\/g, "/") };
					} catch (error) {
						console.error(`Error uploading file: ${error}`);
						const errorMessage = error instanceof Error ? error.message : String(error);
						return { error: `Failed to upload file: ${errorMessage}` };
					}
				},
				{
					query: t.Object({
						dir: t.Optional(t.String())
					}),
					body: t.Object({
						file: t.String(),
						content: t.String()
					})
				}
			)
	);

// io.on(SocketEvent.Connect, socket => {
// 	socket.on(SocketEvent.Hello, message => {
// 		console.log(message);
// 		socket.emit(SocketEvent.Hello, { message: "hello from bun!" });
// 	});
// });
