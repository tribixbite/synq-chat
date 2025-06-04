// vite.config.ts (Root - Base Configuration)
import { resolve } from "node:path";
import { type Plugin, type PluginOption, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { Env, Route } from "./src/shared/constants";

// Custom plugin to properly serve files from public/llm
const llmFilesPlugin = (): Plugin => {
	return {
		name: "llm-files-plugin",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const host = req.headers.host || "";

				// Handle requests from llm.localhost subdomain
				if (host.startsWith("llm.localhost")) {
					// Use the pathname directly without the /llm prefix
					const url = new URL(req.url || "/", `http://${host}`);
					const filePath = url.pathname.startsWith("/")
						? url.pathname.substring(1)
						: url.pathname;

					// Try LLM-specific directory first
					const llmPath = resolve("public/llm", filePath);
					// Fallback to root public directory for shared files
					const publicPath = resolve("public", filePath);

					// Only intercept if the file exists
					try {
						const fs = require("node:fs");
						const path = require("node:path");

						let fullPath: string | null = null;
						let location = "";

						// Check LLM directory first
						if (fs.existsSync(llmPath) && fs.statSync(llmPath).isFile()) {
							fullPath = llmPath;
							location = "LLM-specific";
						}
						// Fallback to root public directory
						else if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
							fullPath = publicPath;
							location = "root public";
						}

						if (fullPath) {
							console.log(
								`Serving ${location} file via LLM subdomain: ${req.url} -> ${fullPath}`
							);

							// Set appropriate content type based on file extension
							const ext = path.extname(fullPath).toLowerCase();
							let contentType = "application/octet-stream"; // default

							switch (ext) {
								case ".txt":
									contentType = "text/plain; charset=utf-8";
									break;
								case ".html":
									contentType = "text/html; charset=utf-8";
									break;
								case ".css":
									contentType = "text/css; charset=utf-8";
									break;
								case ".js":
									contentType = "application/javascript; charset=utf-8";
									break;
								case ".json":
									contentType = "application/json; charset=utf-8";
									break;
								case ".png":
									contentType = "image/png";
									break;
								case ".jpg":
								case ".jpeg":
									contentType = "image/jpeg";
									break;
								case ".gif":
									contentType = "image/gif";
									break;
								case ".svg":
									contentType = "image/svg+xml";
									break;
								case ".pdf":
									contentType = "application/pdf";
									break;
							}

							res.setHeader("Content-Type", contentType);
							res.setHeader("Access-Control-Allow-Origin", "*");

							// Read and send the file
							const fileContents = fs.readFileSync(fullPath);
							res.statusCode = 200;
							res.end(fileContents);
							return;
						}
					} catch (error) {
						console.error(`Error serving LLM file via subdomain: ${error}`);
					}
				}

				// Handle the original /llm/ path for non-subdomain access
				else if (req.url?.startsWith("/llm/")) {
					const filePath = req.url.substring("/llm/".length);
					const fullPath = resolve("public/llm", filePath);

					// Only intercept if the file exists
					try {
						const fs = require("node:fs");
						const path = require("node:path");

						// Check if file exists
						if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
							console.log(`Serving LLM file via path: ${req.url} -> ${fullPath}`);

							// Set appropriate content type based on file extension
							const ext = path.extname(fullPath).toLowerCase();
							let contentType = "application/octet-stream"; // default

							switch (ext) {
								case ".txt":
									contentType = "text/plain; charset=utf-8";
									break;
								case ".html":
									contentType = "text/html; charset=utf-8";
									break;
								case ".css":
									contentType = "text/css; charset=utf-8";
									break;
								case ".js":
									contentType = "application/javascript; charset=utf-8";
									break;
								case ".json":
									contentType = "application/json; charset=utf-8";
									break;
								case ".png":
									contentType = "image/png";
									break;
								case ".jpg":
								case ".jpeg":
									contentType = "image/jpeg";
									break;
								case ".gif":
									contentType = "image/gif";
									break;
								case ".svg":
									contentType = "image/svg+xml";
									break;
								case ".pdf":
									contentType = "application/pdf";
									break;
							}

							res.setHeader("Content-Type", contentType);
							res.setHeader("Access-Control-Allow-Origin", "*");

							// Read and send the file
							const fileContents = fs.readFileSync(fullPath);
							res.statusCode = 200;
							res.end(fileContents);
							return;
						}
					} catch (error) {
						console.error(`Error serving LLM file via path: ${error}`);
					}
				}
				return next();
			});
		}
	};
};

const buildCommonConfig = (mode: string, appName: string, appRoot: string, outDir: string) => ({
	root: resolve(appRoot),
	base: `/${appName}/`,
	define: {
		"import.meta.env.MODE": JSON.stringify(mode)
	},
	server: {
		hmr: true,
		strictPort: false,
		fs: { deny: ["sw.*"] },
		proxy: {
			[Route.Api]: {
				target: "http://localhost:3000",
				changeOrigin: true
			}
		}
	},
	publicDir: resolve(appRoot, "public"),
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: mode !== Env.Production,
		minify: mode === Env.Production,
		rollupOptions: {
			input: {
				main: resolve(appRoot, "index.html")
			},
			output: {
				manualChunks: (path: string) => {
					if (path.includes("node_modules")) return "vendor";
					return null;
				},
				chunkFileNames: "assets/[name]-[hash].js",
				entryFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]"
			}
		}
	}
});

// This is a base configuration that can be imported and extended by app-specific configs
export const createBaseConfig = (options: {
	mode: string;
	appName: string;
	appRoot: string;
	outDir: string;
	plugins?: PluginOption[];
}) => {
	const { mode, appName, appRoot, outDir, plugins = [] } = options;
	return defineConfig({
		...buildCommonConfig(mode, appName, appRoot, outDir),
		plugins: [tsconfigPaths(), ...plugins]
	});
};

// This config is only used for running Vite commands from the root of the monorepo,
// primarily for development convenience. App-specific configs should be used for builds.
export default defineConfig(({ mode }) => ({
	plugins: [tsconfigPaths()],
	optimizeDeps: {
		force: true
	},
	build: {
		// Disable build from root as it should be done through app-specific configs
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, "src/shared/index.ts"),
			formats: ["es"]
		}
	}
}));
