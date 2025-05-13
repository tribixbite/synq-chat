import { resolve } from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

import { Config } from "@server/helpers/config";
import { Env, Path, Route } from "@shared/constants";

const root = Path.ClientSrc;
const outDir = Path.Public;

const toCopy = ["icons/", "favicon.ico"];

// Custom plugin to properly serve files from public/llm
const llmFilesPlugin = (): Plugin => {
	return {
		name: "llm-files-plugin",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				// Check if the request is for a file in the /llm directory
				if (req.url?.startsWith("/llm/")) {
					const filePath = req.url.substring("/llm/".length);
					const fullPath = resolve("public/llm", filePath);

					// Only intercept if the file exists
					try {
						const fs = require("node:fs");
						const path = require("node:path");

						// Check if file exists
						if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
							console.log(`Serving LLM file: ${req.url} -> ${fullPath}`);

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
						console.error(`Error serving LLM file: ${error}`);
					}
				}
				return next();
			});
		}
	};
};

export default defineConfig(({ mode }) => ({
	root: resolve(root),
	define: {
		"import.meta.env.MODE": JSON.stringify(mode),
		"import.meta.env.PORT": JSON.stringify(Config.PORT)
	},
	server: {
		open: true,
		hmr: true,
		strictPort: false,
		proxy: {
			[Route.Api]: {
				target: `http://localhost:${Config.PORT}`,
				changeOrigin: true
			}
		},
		fs: { deny: ["sw.*"] }
	},
	publicDir: resolve("public"),
	build: {
		outDir: resolve(outDir),
		emptyOutDir: true,
		sourcemap: false,
		minify: true,
		rollupOptions: {
			input: {
				main: resolve(root, "index.html"),
				sw: resolve(root, "sw.ts")
			},
			output: {
				manualChunks: path => {
					if (path.includes("node_modules")) return "vendor";
					return null;
				},
				chunkFileNames: "assets/[name]~[hash].js",
				entryFileNames: entry => {
					if (entry.name === "sw") return "sw.js";
					return "assets/[name]~[hash].js";
				},
				assetFileNames: asset => {
					if (asset.names.includes("manifest.json")) return "manifest.json";
					return "assets/[name]~[hash][extname]";
				}
			}
		}
	},
	plugins: [
		llmFilesPlugin(), // Add our custom plugin
		react(),
		tsconfigPaths(),
		...[
			mode === Env.Production
				? viteStaticCopy({
						targets: toCopy.map(path => ({
							src: resolve(root, path),
							dest: "./"
						}))
					})
				: []
		]
	]
}));
