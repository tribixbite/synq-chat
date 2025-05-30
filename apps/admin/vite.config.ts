// apps/admin/vite.config.ts
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// Placeholder for AppInfo - replace with actual data source
const AppInfo = {
	name: "Admin Panel",
	url: "/apps/admin",
	description: "Admin Panel Application",
	author: {
		name: "Your Name",
		url: "yourwebsite.com"
	}
};

// Placeholder for Config.PORT, adjust as needed (see vibesynq config notes)
const Config = {
	PORT: process.env.PORT || 3000
};

const appRoot = __dirname; // apps/admin
// Original admin config had root: resolve(appRoot, "src/client")
const srcDir = resolve(appRoot, "src/client"); // apps/admin/src/client
const outDir = resolve(appRoot, "dist"); // apps/admin/dist
const publicAppPath = "/apps/admin/";

// Assuming these are in src/client/assets/ or similar, adjust paths as needed
// The original admin config had publicDir: resolve(appRoot, "src/client/public/assets")
// So PWA assets might be in src/client/public/assets/icons, etc.
const pwaAssetPaths = ["public/assets/icons/", "public/assets/favicon.ico", "public/manifest.json"];

export default defineConfig(({ mode }) => ({
	root: srcDir,
	base: publicAppPath,
	define: {
		"import.meta.env.MODE": JSON.stringify(mode),
		"import.meta.env.PORT": JSON.stringify(Config.PORT)
	},
	// Original admin publicDir was src/client/public/assets
	// viteStaticCopy will handle copying these now from srcDir + assetPath
	publicDir: false, // Disable default public dir copying, viteStaticCopy handles it
	server: {
		// open: true,
		hmr: true,
		strictPort: false,
		proxy: {
			"/api": {
				target: `http://localhost:${Config.PORT}`,
				changeOrigin: true
			}
		},
		fs: { deny: ["sw.*"] }
	},
	build: {
		outDir: outDir,
		emptyOutDir: true,
		sourcemap: mode !== "production",
		minify: mode === "production",
		rollupOptions: {
			input: {
				main: resolve(srcDir, "index.html"),
				sw: resolve(srcDir, "sw.ts")
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
				assetFileNames: assetInfo => {
					if (assetInfo.name === "manifest.json") return "manifest.json";
					return "assets/[name]~[hash][extname]";
				}
			}
		}
	},
	plugins: [
		react(), // Using react-swc as per original config
		svgr({
			svgrOptions: { exportType: "default", ref: true },
			include: "**/*.svg"
		}),
		tsconfigPaths({
			// Point to the root tsconfig if that's what admin app was using
			// Or remove/adjust if apps/admin/tsconfig.json handles paths itself.
			projects: [resolve(appRoot, "../../tsconfig.json")]
		}),
		{
			name: "html-transform",
			transformIndexHtml(html) {
				return html
					.replace(/{{name}}/g, AppInfo.name)
					.replace(/{{url}}/g, AppInfo.url)
					.replace(/{{description}}/g, AppInfo.description)
					.replace(/{{author.name}}/g, AppInfo.author.name)
					.replace(/{{author.url}}/g, AppInfo.author.url);
			}
		},
		viteStaticCopy({
			targets: pwaAssetPaths.map(assetPath => ({
				// assetPath is relative to srcDir (src/client)
				src: resolve(srcDir, assetPath),
				dest: assetPath.includes("/")
					? assetPath.substring(0, assetPath.lastIndexOf("/"))
					: "."
			})),
			silent: true,
			watch: { reloadPageOnChange: true }
		})
	],
	resolve: {
		alias: {
			// Original aliases from admin config, adjust if src structure changed
			"@": resolve(appRoot, "../../src"),
			"@shared": resolve(appRoot, "../../src/shared"),
			"@client": resolve(appRoot, "../../src/client"),
			"@server": resolve(appRoot, "../../src/server")
		}
	}
}));
