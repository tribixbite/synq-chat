// apps/vibesynq/vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	root: resolve(__dirname, "src"),
	base: "/vibesynq/",
	build: {
		outDir: "../../public/vibesynq",
		emptyOutDir: true,
		rollupOptions: {
			output: {
				manualChunks: undefined // Disable manual chunking to avoid issues
			}
		}
	},
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			"@shared": resolve(__dirname, "../../src/shared")
		}
	}
});
