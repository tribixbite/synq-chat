import { staticPlugin } from "@elysiajs/static";
import Elysia from "elysia";
import { readdirSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

// Test version of dynamic app router plugin without logger
const testAppRouterPlugin = new Elysia({ name: "testDynamicAppRouter" });

const appsDir = resolve(process.cwd(), "public/apps");

try {
	// Get all items in public/apps/
	const items = readdirSync(appsDir);

	// Separate directories from files, and handle the special 'html' directory
	const appDirectories: string[] = [];
	let htmlDirectory: string | null = null;

	for (const item of items) {
		const itemPath = resolve(appsDir, item);
		const itemStat = statSync(itemPath);

		if (itemStat.isDirectory()) {
			if (item === "html") {
				htmlDirectory = item;
			} else {
				appDirectories.push(item);
			}
		}
	}

	console.log(`Found ${appDirectories.length} app directories:`, appDirectories);

	// 1. Create static plugins for each app directory (except 'html')
	for (const appDir of appDirectories) {
		const appPath = `/apps/${appDir}`;

		console.log(`Registering app directory: ${appDir} at ${appPath}`);

		testAppRouterPlugin.use(
			staticPlugin({
				assets: `public/apps/${appDir}`,
				prefix: appPath,
				indexHTML: true,
				headers: {
					"Cache-Control": "public, max-age=3600"
				}
			})
		);
	}

	// 2. Handle standalone HTML files in public/apps/html/
	if (htmlDirectory) {
		const htmlDir = resolve(appsDir, htmlDirectory);

		try {
			const htmlFiles = readdirSync(htmlDir).filter(
				file => extname(file).toLowerCase() === ".html"
			);

			console.log(`Found ${htmlFiles.length} HTML files:`, htmlFiles);

			for (const htmlFile of htmlFiles) {
				const fileName = basename(htmlFile, ".html");
				const appPath = `/apps/${fileName}`;
				const filePath = resolve(htmlDir, htmlFile);

				console.log(`Registering standalone HTML app: ${fileName} at ${appPath}`);

				// Serve the HTML file directly at /apps/{filename}
				testAppRouterPlugin.get(appPath, () => Bun.file(filePath));

				// Also serve with trailing slash for consistency
				testAppRouterPlugin.get(`${appPath}/`, () => Bun.file(filePath));
			}
		} catch (htmlError) {
			console.error("Error reading HTML directory:", htmlError);
		}
	}

	console.log("Dynamic app router initialized successfully");
} catch (error) {
	console.error("Error initializing dynamic app router:", error);
}

const app = new Elysia({ name: "test-server" })
	.get("/test", () => ({
		message: "Test route works!",
		timestamp: new Date().toISOString(),
		success: true
	}))
	.get("/apps/agents-john", () => {
		const filePath = resolve(process.cwd(), "public/apps/html/agents-john.html");
		return Bun.file(filePath);
	})
	.use(testAppRouterPlugin)
	.listen(3333, () => {
		console.log("🚀 Minimal Test Server listening on http://localhost:3333");
		console.log("📄 Single HTML route: /apps/agents-john");
	});

export type App = typeof app;
