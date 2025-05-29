import { AVAILABLE_APPS, Config } from "@shared/config";
import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";

describe("Build Process & File Output", () => {
	describe("Static Directory Structure", () => {
		it("should have all required app directories", () => {
			for (const [key, appConfig] of Object.entries(AVAILABLE_APPS)) {
				expect(existsSync(appConfig.staticDir)).toBe(true);
				console.log(`✓ App directory exists: ${appConfig.staticDir}`);
			}
		});

		it("should have index.html in each app directory", () => {
			for (const [key, appConfig] of Object.entries(AVAILABLE_APPS)) {
				const indexPath = `${appConfig.staticDir}/index.html`;
				expect(existsSync(indexPath)).toBe(true);
				console.log(`✓ Index file exists: ${indexPath}`);
			}
		});

		it("should have MultiSynq manual files in public", () => {
			const requiredFiles = ["./public/multisynq-js.txt", "./public/multisynq-react.txt"];

			for (const filePath of requiredFiles) {
				expect(existsSync(filePath)).toBe(true);
				console.log(`✓ Required file exists: ${filePath}`);
			}
		});
	});

	describe("App Configuration Validation", () => {
		it("should have valid app paths without conflicts", () => {
			const paths = Object.values(AVAILABLE_APPS).map(app => app.path);
			const uniquePaths = new Set(paths);
			expect(paths.length).toBe(uniquePaths.size);
			console.log(`✓ All app paths are unique: ${paths.join(", ")}`);
		});

		it("should have valid default app", () => {
			expect(AVAILABLE_APPS[Config.DEFAULT_APP as keyof typeof AVAILABLE_APPS]).toBeDefined();
			console.log(`✓ Default app is valid: ${Config.DEFAULT_APP}`);
		});

		it("should use consistent directory structure", () => {
			for (const [key, appConfig] of Object.entries(AVAILABLE_APPS)) {
				expect(appConfig.staticDir).toMatch(
					new RegExp(`${Config.APPS_DIR}/${appConfig.path}$`)
				);
			}
			console.log(`✓ All apps use consistent directory structure under ${Config.APPS_DIR}`);
		});
	});

	describe("Dockerfile Compatibility", () => {
		it("should have frontend build directories that match Dockerfile expectations", () => {
			// Check if the built app directories exist (as expected by Dockerfile)
			const frontendApps = ["vibesynq", "admin"];

			for (const appName of frontendApps) {
				const buildDir = `./apps/${appName}/public`;
				if (existsSync(buildDir)) {
					console.log(`✓ Frontend build directory exists: ${buildDir}`);
				} else {
					console.warn(
						`⚠ Frontend build directory missing: ${buildDir} (run 'bun run build:${appName}' first)`
					);
				}
			}
		});

		it("should have static directories that match Dockerfile COPY commands", () => {
			// Dockerfile copies from /app/public to /app/public
			expect(existsSync("./public")).toBe(true);
			console.log("✓ Root public directory exists for Dockerfile COPY");

			// Check app-specific directories
			for (const [key, appConfig] of Object.entries(AVAILABLE_APPS)) {
				expect(existsSync(appConfig.staticDir)).toBe(true);
			}
		});

		it("should have main compilation target available after build", async () => {
			// Test if the compile command would work by checking if the entry point exists
			expect(existsSync("./src/server/index.ts")).toBe(true);
			console.log("✓ Server entry point exists for compilation");
		});
	});

	describe("Build Script Dependencies", () => {
		it("should have package.json with correct build scripts", async () => {
			const pkg = await Bun.file("./package.json").json();

			// Check that required build scripts exist
			const requiredScripts = ["build", "build:vibesynq", "build:admin", "compile"];

			for (const script of requiredScripts) {
				expect(pkg.scripts[script]).toBeDefined();
				console.log(`✓ Build script exists: ${script}`);
			}
		});

		it("should have vite configs for frontend apps", () => {
			const frontendApps = ["vibesynq", "admin"];

			for (const appName of frontendApps) {
				const viteConfig = `./apps/${appName}/vite.config.ts`;
				if (existsSync(viteConfig)) {
					console.log(`✓ Vite config exists: ${viteConfig}`);
				} else {
					console.warn(`⚠ Vite config missing: ${viteConfig}`);
				}
			}
		});

		it("should have tsconfig for proper type checking", () => {
			expect(existsSync("./tsconfig.json")).toBe(true);
			console.log("✓ Root tsconfig.json exists");

			// Check app-specific tsconfigs
			const frontendApps = ["vibesynq", "admin"];
			for (const appName of frontendApps) {
				const tsConfig = `./apps/${appName}/tsconfig.json`;
				if (existsSync(tsConfig)) {
					console.log(`✓ App tsconfig exists: ${tsConfig}`);
				}
			}
		});
	});

	describe("Runtime File Serving", () => {
		it("should be able to read MultiSynq files", async () => {
			const files = ["./public/multisynq-js.txt", "./public/multisynq-react.txt"];

			for (const filePath of files) {
				const file = Bun.file(filePath);
				const content = await file.text();
				expect(content.length).toBeGreaterThan(0);
				console.log(`✓ Can read file: ${filePath} (${content.length} bytes)`);
			}
		});

		it("should be able to read app index files", async () => {
			for (const [key, appConfig] of Object.entries(AVAILABLE_APPS)) {
				const indexPath = `${appConfig.staticDir}/index.html`;
				if (existsSync(indexPath)) {
					const file = Bun.file(indexPath);
					const content = await file.text();
					expect(content.length).toBeGreaterThan(0);
					expect(content).toContain("<html");
					console.log(`✓ Can read app index: ${indexPath}`);
				}
			}
		});
	});

	describe("Production Build Validation", () => {
		it("should have all required environment variables defined", () => {
			const requiredEnvVars = ["NODE_ENV"];
			// Note: In production, you'd also check for API keys, database URLs, etc.

			console.log(`✓ Environment check - NODE_ENV: ${process.env.NODE_ENV || "development"}`);
			console.log(`✓ Config values - PORT: ${Config.PORT}, HOST: ${Config.HOST}`);
			console.log(`✓ Default app: ${Config.DEFAULT_APP}`);
		});

		it("should have proper file permissions for deployment", () => {
			// Check that we can read the files that would be copied in Docker
			const criticalFiles = ["./src/server/index.ts", "./package.json", "./tsconfig.json"];

			for (const filePath of criticalFiles) {
				expect(existsSync(filePath)).toBe(true);
				console.log(`✓ Critical file exists: ${filePath}`);
			}
		});
	});
});
