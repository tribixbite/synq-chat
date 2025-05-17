import { resolve } from "node:path";
// apps/admin/vite.config.ts
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { type Target, viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";
import { Env, Route } from "../../src/shared/constants";

const root = resolve(__dirname, "src/client");
const outDir = resolve(__dirname, "public");
const toCopy: Target[] = [];

export default defineConfig(({ mode }) => ({
	root,
	base: "/admin/",
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
	publicDir: resolve(__dirname, "src/client/public_static"),
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: mode !== Env.Production,
		minify: mode === Env.Production,
		rollupOptions: {
			input: {
				main: resolve(root, "index.html")
			},
			output: {
				manualChunks: path => {
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
			projects: [resolve(__dirname, "tsconfig.json")]
		}),
		...(mode === Env.Production && toCopy.length > 0
			? [
					viteStaticCopy({
						targets: toCopy
					})
				]
			: [])
	],
	resolve: {}
}));
