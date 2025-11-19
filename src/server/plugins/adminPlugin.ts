import { staticPlugin } from "@elysiajs/static";
import { Elysia, t } from "elysia";
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile, unlink, stat, readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { clearAppCache } from "./appRouterPlugin";

// App types for upload routing
type AppType = "tsx" | "html" | "unknown";

// Determine app type from filename
function getAppType(filename: string): AppType {
	const ext = extname(filename).toLowerCase();
	if (ext === ".tsx") return "tsx";
	if (ext === ".html" || ext === ".htm") return "html";
	return "unknown";
}

// Sanitize filename for security
function sanitizeFilename(filename: string): string {
	// Remove path traversal attempts and special characters
	return basename(filename)
		.replace(/[^a-zA-Z0-9._-]/g, "-")
		.replace(/^\.+/, "")
		.toLowerCase();
}

// Get app name from filename (without extension)
function getAppName(filename: string): string {
	return basename(filename, extname(filename));
}

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
			// App upload endpoint - auto-routes to correct folder
			.post(
				"/upload-app",
				async ({ body }) => {
					const { filename, content, description, author } = body;

					// Validate file type
					const appType = getAppType(filename);
					if (appType === "unknown") {
						return {
							error: "Invalid file type. Only .tsx and .html files are supported.",
							supportedTypes: [".tsx", ".html"]
						};
					}

					// Sanitize filename
					const safeFilename = sanitizeFilename(filename);
					if (!safeFilename) {
						return { error: "Invalid filename" };
					}

					// Determine target directory based on file type
					const targetDir = appType === "tsx" ? "public/apps/tsx" : "public/apps/html";

					const targetPath = join(targetDir, safeFilename);
					const appName = getAppName(safeFilename);

					try {
						// Ensure directory exists
						await mkdir(targetDir, { recursive: true });

						// Write the app file
						await writeFile(targetPath, content);

						// Clear cache for TSX apps so changes take effect immediately
						if (appType === "tsx") {
							clearAppCache(appName);
						}

						// Optionally create metadata file
						if (description || author) {
							const metadataPath = join(targetDir, `${appName}.meta.json`);
							const metadata = {
								name: appName,
								description: description || "",
								author: author || "",
								type: appType,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString()
							};
							await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
						}

						console.log(`[ADMIN] App uploaded: ${safeFilename} -> ${targetPath}`);

						return {
							success: true,
							path: targetPath,
							appName,
							appType,
							url: `/apps/${appName}`,
							message: `App "${appName}" is now live at /apps/${appName}`
						};
					} catch (error) {
						console.error(`[ADMIN] Error uploading app: ${error}`);
						const errorMessage = error instanceof Error ? error.message : String(error);
						return { error: `Failed to upload app: ${errorMessage}` };
					}
				},
				{
					body: t.Object({
						filename: t.String(),
						content: t.String(),
						description: t.Optional(t.String()),
						author: t.Optional(t.String())
					})
				}
			)
			// List all apps endpoint
			.get("/apps", async () => {
				try {
					const apps: Array<{
						name: string;
						type: AppType;
						path: string;
						url: string;
						size: number;
						modifiedAt: string;
						metadata?: {
							description?: string;
							author?: string;
						};
					}> = [];

					// Scan TSX apps
					const tsxDir = "public/apps/tsx";
					if (existsSync(tsxDir)) {
						const tsxFiles = await readdir(tsxDir);
						for (const file of tsxFiles) {
							if (file.endsWith(".tsx")) {
								const filePath = join(tsxDir, file);
								const stats = await stat(filePath);
								const appName = getAppName(file);

								// Try to load metadata
								let metadata: { description?: string; author?: string } | undefined;
								const metaPath = join(tsxDir, `${appName}.meta.json`);
								if (existsSync(metaPath)) {
									try {
										const metaContent = await readFile(metaPath, "utf-8");
										metadata = JSON.parse(metaContent);
									} catch {}
								}

								apps.push({
									name: appName,
									type: "tsx",
									path: filePath,
									url: `/apps/${appName}`,
									size: stats.size,
									modifiedAt: stats.mtime.toISOString(),
									metadata
								});
							}
						}
					}

					// Scan HTML apps
					const htmlDir = "public/apps/html";
					if (existsSync(htmlDir)) {
						const htmlFiles = await readdir(htmlDir);
						for (const file of htmlFiles) {
							if (file.endsWith(".html") || file.endsWith(".htm")) {
								const filePath = join(htmlDir, file);
								const stats = await stat(filePath);
								const appName = getAppName(file);

								// Try to load metadata
								let metadata: { description?: string; author?: string } | undefined;
								const metaPath = join(htmlDir, `${appName}.meta.json`);
								if (existsSync(metaPath)) {
									try {
										const metaContent = await readFile(metaPath, "utf-8");
										metadata = JSON.parse(metaContent);
									} catch {}
								}

								apps.push({
									name: appName,
									type: "html",
									path: filePath,
									url: `/apps/${appName}`,
									size: stats.size,
									modifiedAt: stats.mtime.toISOString(),
									metadata
								});
							}
						}
					}

					// Sort by modification time (newest first)
					apps.sort(
						(a, b) =>
							new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
					);

					return { apps, total: apps.length };
				} catch (error) {
					console.error(`[ADMIN] Error listing apps: ${error}`);
					const errorMessage = error instanceof Error ? error.message : String(error);
					return { error: `Failed to list apps: ${errorMessage}` };
				}
			})
			// Get app content endpoint
			.get(
				"/apps/:name",
				async ({ params }) => {
					const { name } = params;

					// Check TSX first
					let filePath = join("public/apps/tsx", `${name}.tsx`);
					let appType: AppType = "tsx";

					if (!existsSync(filePath)) {
						// Check HTML
						filePath = join("public/apps/html", `${name}.html`);
						appType = "html";

						if (!existsSync(filePath)) {
							return { error: "App not found" };
						}
					}

					try {
						const content = await readFile(filePath, "utf-8");
						const stats = await stat(filePath);

						// Try to load metadata
						let metadata: { description?: string; author?: string } | undefined;
						const metaPath = filePath.replace(/\.(tsx|html)$/, ".meta.json");
						if (existsSync(metaPath)) {
							try {
								const metaContent = await readFile(metaPath, "utf-8");
								metadata = JSON.parse(metaContent);
							} catch {}
						}

						return {
							name,
							type: appType,
							content,
							path: filePath,
							url: `/apps/${name}`,
							size: stats.size,
							modifiedAt: stats.mtime.toISOString(),
							metadata
						};
					} catch (error) {
						console.error(`[ADMIN] Error getting app: ${error}`);
						const errorMessage = error instanceof Error ? error.message : String(error);
						return { error: `Failed to get app: ${errorMessage}` };
					}
				},
				{
					params: t.Object({
						name: t.String()
					})
				}
			)
			// Delete app endpoint
			.delete(
				"/apps/:name",
				async ({ params }) => {
					const { name } = params;

					// Check TSX first
					let filePath = join("public/apps/tsx", `${name}.tsx`);
					let metaPath = join("public/apps/tsx", `${name}.meta.json`);
					let appType: AppType = "tsx";

					if (!existsSync(filePath)) {
						// Check HTML
						filePath = join("public/apps/html", `${name}.html`);
						metaPath = join("public/apps/html", `${name}.meta.json`);
						appType = "html";

						if (!existsSync(filePath)) {
							return { error: "App not found" };
						}
					}

					try {
						// Delete the app file
						await unlink(filePath);

						// Delete metadata if exists
						if (existsSync(metaPath)) {
							await unlink(metaPath);
						}

						// Clear cache for TSX apps
						if (appType === "tsx") {
							clearAppCache(name);
						}

						console.log(`[ADMIN] App deleted: ${name}`);

						return {
							success: true,
							message: `App "${name}" has been deleted`
						};
					} catch (error) {
						console.error(`[ADMIN] Error deleting app: ${error}`);
						const errorMessage = error instanceof Error ? error.message : String(error);
						return { error: `Failed to delete app: ${errorMessage}` };
					}
				},
				{
					params: t.Object({
						name: t.String()
					})
				}
			)
			// Update app endpoint
			.put(
				"/apps/:name",
				async ({ params, body }) => {
					const { name } = params;
					const { content, description, author } = body;

					// Check TSX first
					let filePath = join("public/apps/tsx", `${name}.tsx`);
					let metaPath = join("public/apps/tsx", `${name}.meta.json`);
					let appType: AppType = "tsx";

					if (!existsSync(filePath)) {
						// Check HTML
						filePath = join("public/apps/html", `${name}.html`);
						metaPath = join("public/apps/html", `${name}.meta.json`);
						appType = "html";

						if (!existsSync(filePath)) {
							return { error: "App not found" };
						}
					}

					try {
						// Update the app content
						await writeFile(filePath, content);

						// Update metadata
						let metadata: Record<string, unknown> = {};
						if (existsSync(metaPath)) {
							try {
								const metaContent = await readFile(metaPath, "utf-8");
								metadata = JSON.parse(metaContent);
							} catch {}
						}

						metadata.updatedAt = new Date().toISOString();
						if (description !== undefined) metadata.description = description;
						if (author !== undefined) metadata.author = author;

						await writeFile(metaPath, JSON.stringify(metadata, null, 2));

						// Clear cache for TSX apps
						if (appType === "tsx") {
							clearAppCache(name);
						}

						console.log(`[ADMIN] App updated: ${name}`);

						return {
							success: true,
							message: `App "${name}" has been updated`,
							url: `/apps/${name}`
						};
					} catch (error) {
						console.error(`[ADMIN] Error updating app: ${error}`);
						const errorMessage = error instanceof Error ? error.message : String(error);
						return { error: `Failed to update app: ${errorMessage}` };
					}
				},
				{
					params: t.Object({
						name: t.String()
					}),
					body: t.Object({
						content: t.String(),
						description: t.Optional(t.String()),
						author: t.Optional(t.String())
					})
				}
			)
	);
