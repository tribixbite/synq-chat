// apps/vibesynq/vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// Placeholder for AppInfo - you should replace this with actual data source
const AppInfo = {
	name: "VibeSynq",
	url: "/apps/vibesynq",
	description: "VibeSynq Application",
	author: {
		name: "Your Name",
		url: "yourwebsite.com"
	}
};

// Placeholder for Config.PORT, assuming it might be needed.
// The original template had `import { Config } from "@server/helpers/config";`
// Adjust this import path if it's different or manage PORT some other way.
// For now, hardcoding a typical dev port, but this should come from your actual config.
const Config = {
	PORT: process.env.PORT || 3000
};

// Define paths relative to this config file or project root as needed
const appRoot = __dirname; // apps/vibesynq
const srcDir = resolve(appRoot, "src"); // apps/vibesynq/src
const outDir = resolve(appRoot, "dist"); // apps/vibesynq/dist
const publicAppPath = "/apps/vibesynq/";

const pwaAssetPaths = ["assets/icons/", "assets/favicon.ico", "manifest.json"]; // Assuming these are in src/assets/

export default defineConfig(({ mode }) => ({
	root: srcDir,
	base: publicAppPath,
	define: {
		"import.meta.env.MODE": JSON.stringify(mode),
		"import.meta.env.PORT": JSON.stringify(Config.PORT) // Example, if needed by client
	},
	server: {
		// open: true, // Consider if you want this
		hmr: true,
		strictPort: false,
		proxy: {
			"/api": {
				// Assuming API routes are at /api
				target: `http://localhost:${Config.PORT}`,
				changeOrigin: true
			}
		},
		fs: { deny: ["sw.*"] } // Deny serving sw.js from root by mistake
	},
	build: {
		outDir: outDir,
		emptyOutDir: true,
		sourcemap: mode !== "production", // Enable sourcemaps for dev builds if needed
		minify: mode === "production",
		rollupOptions: {
			input: {
				main: resolve(srcDir, "index.html"),
				sw: resolve(srcDir, "sw.ts") // Path to your service worker
			},
			output: {
				manualChunks: path => {
					if (path.includes("node_modules")) return "vendor";
					return null;
				},
				chunkFileNames: "assets/[name]~[hash].js",
				entryFileNames: entry => {
					if (entry.name === "sw") return "sw.js"; // Output sw.js to the root of outDir
					return "assets/[name]~[hash].js";
				},
				assetFileNames: assetInfo => {
					// Handle manifest.json specifically if it's generated or copied
					if (assetInfo.name === "manifest.json") return "manifest.json";
					return "assets/[name]~[hash][extname]";
				}
			}
		}
	},
	plugins: [
		react({
			// If using React 19 compiler (optional)
			// babel: {
			//  plugins: [["babel-plugin-react-compiler", {}]]
			// }
		}),
		tailwindcss(),
		svgr({
			svgrOptions: {
				exportType: "default",
				ref: true
			},
			include: "**/*.svg"
		}),
		tsconfigPaths(), // Ensure this is configured correctly in tsconfig if used deeply
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
				src: resolve(srcDir, assetPath),
				dest: assetPath.includes("/")
					? assetPath.substring(0, assetPath.lastIndexOf("/"))
					: "."
			})),
			silent: true, // Suppress logs for copied files
			watch: {
				// During development, trigger rebuilds when these files change.
				reloadPageOnChange: true
			}
		})
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			"@shared": resolve(__dirname, "../../src/shared")
		}
	}
}));
