import { staticPlugin } from "@elysiajs/static";
import { Elysia, t } from "elysia";
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Plugin for the Admin app
export const adminPlugin = new Elysia()
	// Guard to ensure this plugin only runs for the admin subdomain
	// .guard({
	// 	beforeHandle: ({ subdomain }: Context & { subdomain?: string }) => {
	// 		// console.log("Admin Plugin Guard: Inherited Subdomain:", subdomain);
	// 		return subdomain === "admin";
	// 	}
	// })
	// Admin static files
	.group("/admin", app =>
		app.use(
			staticPlugin({
				assets: "./apps/admin/public",
				alwaysStatic: true,
				indexHTML: true,
				prefix: "/"
			})
		)
	)
	// Admin API routes
	.group("/api/admin", app =>
		app
			// File listing endpoint
			.get(
				"/files",
				async ({ query }) => {
					const dir = query.dir || "";
					const basePath = "public";
					const targetPath = join(basePath, dir);

					if (!targetPath.startsWith(basePath)) {
						return { error: "Invalid directory path" };
					}

					try {
						if (!existsSync(targetPath)) {
							await mkdir(targetPath, { recursive: true });
						}

						const files = await readdir(targetPath, { withFileTypes: true });
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
			// File upload endpoint
			.post(
				"/upload",
				async ({ body, query }) => {
					const { file, content } = body;
					const dir = query.dir || "";
					const basePath = "public";
					const targetDir = join(basePath, dir);
					const targetPath = join(targetDir, file);

					if (!targetPath.startsWith(basePath)) {
						return { error: "Invalid file path" };
					}

					try {
						if (!existsSync(targetDir)) {
							await mkdir(targetDir, { recursive: true });
						}

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
