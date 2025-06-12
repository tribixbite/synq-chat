// apps/admin/vite.config.ts
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
// import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import { Env, Route } from "../../src/shared/constants";

// App configuration
const AppInfo = {
	name: "Admin Panel",
	url: "/apps/admin",
	description: "Admin Panel Application",
	author: {
		name: "Your Name",
		url: "yourwebsite.com"
	}
};

// Define paths following the root template structure
const appRoot = __dirname; // apps/admin
const outDir = resolve(__dirname, "../../public/apps/admin"); // Output to public/apps/admin

// PWA asset paths - these should be in the app's public directory
const pwaAssetPaths = ["public/assets/icons/", "public/assets/favicon.ico", "public/manifest.json"];

const buildConfig = (mode: string) => ({
	root: appRoot, // Use app root, not src/client
	base: mode === Env.Production ? "/apps/admin/" : "/",
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
	publicDir: resolve(appRoot, "public"), // Look for public dir in app root
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: mode !== Env.Production,
		minify: mode === Env.Production,
		rollupOptions: {
			input: {
				main: resolve(appRoot, "index.html"), // index.html in app root
				sw: resolve(appRoot, "src/client/sw.ts") // Service worker in src/client
			},
			output: {
				manualChunks: (path: string) => {
					if (path.includes("node_modules")) return "vendor";
					return null;
				},
				chunkFileNames: "assets/[name]-[hash].js",
				entryFileNames: (entry: { name: string }) => {
					if (entry.name === "sw") return "sw.js";
					return "assets/[name]-[hash].js";
				},
				assetFileNames: (assetInfo: { name?: string }) => {
					if (assetInfo.name === "manifest.json") return "manifest.json";
					return "assets/[name]-[hash][extname]";
				}
			}
		}
	}
});

export default defineConfig(({ mode }) => ({
	...buildConfig(mode),
	plugins: [
		react(),
		// svgr({
		// 	svgrOptions: { exportType: "default", ref: true },
		// 	include: "**/*.svg"
		// }),
		tsconfigPaths(),
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
				src: resolve(appRoot, assetPath),
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
			"@": resolve(__dirname, "src"),
			"@shared": resolve(__dirname, "../../src/shared")
		}
	}
}));
