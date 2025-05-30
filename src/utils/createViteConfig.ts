// src/utils/createViteConfig.ts - Unified Vite config factory
import { Env, Route } from "@shared/constants";
import react from "@vitejs/plugin-react-swc";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type PluginOption } from "vite";
import { type Target, viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

export interface ViteAppConfig {
	appName: string;
	appDir: string; // e.g., "apps/vibesynq" or "apps/admin"
	additionalPlugins?: PluginOption[];
	staticCopyTargets?: Target[];
	clientSubPath?: string; // e.g., "src/client" for admin, "src" for vibesynq
	publicAssetsPath?: string; // Custom public assets path if needed
}

export const createViteConfig = (config: ViteAppConfig) => {
	const {
		appName,
		appDir,
		additionalPlugins = [],
		staticCopyTargets = [],
		clientSubPath = "src",
		publicAssetsPath
	} = config;

	// Resolve paths
	const appRoot = resolve(appDir);
	const srcRoot = resolve(appRoot, clientSubPath);

	// Calculate the path back to the project root from the app directory
	const projectRoot = resolve(appRoot, "../..");

	const outDir = resolve(projectRoot, "public", appName); // Build to project root public/{appName}
	const defaultPublicDir = resolve(srcRoot, "public");
	const publicDir = publicAssetsPath ? resolve(appRoot, publicAssetsPath) : defaultPublicDir;

	const base = `/${appName}/`;

	return defineConfig(({ mode }) => {
		// Build entry points - always include main, add sw.ts if it exists
		const input: Record<string, string> = {
			main: resolve(srcRoot, "index.html")
		};

		const swPath = resolve(srcRoot, "sw.ts");
		if (existsSync(swPath)) {
			input.sw = swPath;
		}

		return {
			root: srcRoot,
			base,
			define: {
				"import.meta.env.MODE": JSON.stringify(mode)
			},
			server: {
				hmr: true,
				strictPort: false,
				fs: { deny: ["sw.*"] },
				proxy: {
					[Route.Api]: {
						target: `http://localhost:3000${base}`,
						changeOrigin: true
					}
				}
			},
			publicDir,
			build: {
				outDir,
				emptyOutDir: true,
				sourcemap: mode !== Env.Production,
				minify: mode === Env.Production,
				rollupOptions: {
					input,
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
			},
			plugins: [
				react(),
				tsconfigPaths({
					projects: [resolve(projectRoot, "tsconfig.json")]
				}),
				...additionalPlugins,
				...(mode === Env.Production && staticCopyTargets.length > 0
					? [viteStaticCopy({ targets: staticCopyTargets })]
					: [])
			],
			resolve: {
				alias: {
					"@": resolve(projectRoot, "src"),
					"@shared": resolve(projectRoot, "src/shared"),
					"@client": resolve(projectRoot, "src/client"),
					"@server": resolve(projectRoot, "src/server")
				}
			}
		};
	});
};
