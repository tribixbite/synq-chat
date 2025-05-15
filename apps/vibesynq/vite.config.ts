import { resolve } from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { type Target, viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

// Assuming shared config might be used later
// import { Config } from "@shared/config";
import { Env, Route } from "@shared/constants";

const projectRoot = resolve(__dirname, "../.."); // Monorepo root
const root = resolve(__dirname, "src/client");
const outDir = resolve(__dirname, "public");

const toCopy: Target[] = [
	// Add any specific static assets for vibesynq if needed
	// e.g., { src: resolve(root, "assets/icon.png"), dest: "assets" }
];

export default defineConfig(({ mode }) => ({
	root,
	base: "/vibesynq/",
	define: {
		"import.meta.env.MODE": JSON.stringify(mode)
		// "import.meta.env.PORT": JSON.stringify(Config.PORT) // If needed
	},
	server: {
		// open: true, // Consider if you want auto-open for each app
		hmr: true,
		strictPort: false, // Allow flexible port for dev
		fs: { deny: ["sw.*"] }, // If you have a service worker
		proxy: {
			[Route.Api]: {
				target: "http://localhost:3000", // Corrected template literal
				changeOrigin: true
			}
		}
	},
	publicDir: resolve(__dirname, "src/client/public_static"), // Optional: if you have static assets specific to this app's source not for root public
	build: {
		outDir,
		emptyOutDir: true,
		sourcemap: mode !== Env.Production,
		minify: mode === Env.Production,
		rollupOptions: {
			input: {
				main: resolve(root, "index.html")
				// sw: resolve(root, "sw.ts") // If you have a service worker
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
			projects: [resolve(projectRoot, "tsconfig.json")]
		}),
		...(mode === Env.Production && toCopy.length > 0
			? [
					viteStaticCopy({
						targets: toCopy
					})
				]
			: [])
	]
}));
