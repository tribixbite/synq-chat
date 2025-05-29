import { resolve } from "node:path";
// apps/admin/vite.config.ts
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { type Target, viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";
import { Env, Route } from "../../src/shared/constants";

const base = "/admin/";

const root = resolve(__dirname, "src/client");
const outDir = resolve(__dirname, "../../public/admin"); // Build output goes to project root public/admin
const publicDir = resolve(__dirname, "src/client/public/assets"); // Static assets from client/public/assets
const toCopy: Target[] = [];

export default defineConfig(({ mode }) => ({
	root,
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
	publicDir, // Use separate directory for static assets
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: mode !== Env.Production,
		minify: mode === Env.Production,
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
				chunkFileNames: "assets/[name]-[hash].js",
				entryFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]"
			}
		}
	},
	plugins: [
		react(),
		tsconfigPaths({
			projects: [resolve(__dirname, "../../tsconfig.json")]
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
