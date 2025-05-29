// apps/vibesynq/vite.config.ts
import { createBaseConfig } from "@/vite.config";
import { Env } from "@shared/constants";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { type Target, viteStaticCopy } from "vite-plugin-static-copy";

const appRoot = resolve(__dirname); // Change from 'src' to the app root
const srcDir = resolve(__dirname, "src"); // Separate src directory
const outDir = resolve(__dirname, "../../public/vibesynq"); // Build output goes to project root public/vibesynq
const toCopy: Target[] = [];

export default defineConfig(({ mode }) => {
	const baseConfig = createBaseConfig({
		mode,
		appName: "vibesynq",
		appRoot: srcDir, // Use src directory for the base config
		outDir,
		plugins: [
			react(),
			tailwindcss(),
			...(mode === Env.Production && toCopy.length > 0
				? [
						viteStaticCopy({
							targets: toCopy
						})
					]
				: [])
		]
	});

	// Add any Vibesynq app-specific configuration overrides here
	// For example, if you need to integrate Three.js or react-together
	return {
		...baseConfig,
		// Override the publicDir to point to the correct location
		publicDir: resolve(appRoot, "public"),
		// Vibesynq-specific overrides, like optimizeDeps for Three.js
		optimizeDeps: {
			...baseConfig.optimizeDeps,
			include: [
				"three",
				"react-together"
				// Add other Vibesynq-specific dependencies that should be pre-bundled
			]
		}
	};
});
