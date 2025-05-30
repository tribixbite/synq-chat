// apps/admin/vite.config.ts
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const appName = "admin";
const appRoot = resolve(__dirname);
const srcRoot = resolve(appRoot, "src/client");
const outDir = resolve(appRoot, "../../public", appName);
const base = `/${appName}/`;

export default defineConfig(({ mode }) => ({
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
			"/api": {
				target: `http://localhost:3000${base}`,
				changeOrigin: true
			}
		}
	},
	publicDir: resolve(appRoot, "src/client/public/assets"),
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: mode !== "production",
		minify: mode === "production",
		rollupOptions: {
			input: {
				main: resolve(srcRoot, "index.html"),
				sw: resolve(srcRoot, "sw.ts")
			},
			output: {
				manualChunks: undefined
			}
		}
	},
	plugins: [
		react(),
		tsconfigPaths({
			projects: [resolve(appRoot, "../../tsconfig.json")]
		})
	],
	resolve: {
		alias: {
			"@": resolve(appRoot, "../../src"),
			"@shared": resolve(appRoot, "../../src/shared"),
			"@client": resolve(appRoot, "../../src/client"),
			"@server": resolve(appRoot, "../../src/server")
		}
	}
}));
