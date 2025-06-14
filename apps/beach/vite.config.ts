import { Env, Route } from "@shared/constants";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// App configuration
const AppInfo = {
	name: "Beach Experience",
	url: "/apps/beach",
	description: "Immersive 3D Beach Experience",
	author: {
		name: "Your Name",
		url: "yourwebsite.com"
	}
};

// Define paths
const appRoot = __dirname; // apps/beach
const outDir = resolve(__dirname, "../../public/apps/beach"); // Output to public/apps/beach

const buildConfig = (mode: string) => ({
	root: appRoot, // Use app root, not src
	base: "/apps/beach/", // Always use the same base path to match our routing
	define: {
		"import.meta.env.MODE": JSON.stringify(mode),
		"import.meta.env.BUILD_DATE": JSON.stringify(new Date().toISOString())
	},

	server: {
		port: 5174, // Different port from vibesynq (5173)
		host: true,
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
				main: resolve(appRoot, "index.html") // index.html in app root
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
		},
		// Optimize for production
		...(mode === Env.Production && {
			cssCodeSplit: true,
			reportCompressedSize: false
		})
	},

	plugins: [
		react({
			// Enable React Fast Refresh
			// fastRefresh: mode !== Env.Production
		}),
		tsconfigPaths(),
		{
			name: "html-transform",
			transformIndexHtml(html: string) {
				return html
					.replace(/{{name}}/g, AppInfo.name)
					.replace(/{{url}}/g, AppInfo.url)
					.replace(/{{description}}/g, AppInfo.description)
					.replace(/{{author.name}}/g, AppInfo.author.name)
					.replace(/{{author.url}}/g, AppInfo.author.url);
			}
		}
	],

	resolve: {
		alias: {
			"@": resolve(appRoot, "src"),
			"@assets": resolve(appRoot, "src/assets"),
			"@shared": resolve(__dirname, "../../src/shared")
		}
	},

	// Optimize dependencies
	optimizeDeps: {
		include: ["react", "react-dom"],
		exclude: ["lucide-react", "@shared/constants"] // Exclude internal modules
	}
});

export default defineConfig(({ mode }) => buildConfig(mode));
