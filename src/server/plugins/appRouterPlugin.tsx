import type { RequestContext } from "@/shared/types";
import { html, Html } from "@elysiajs/html";
import { Glob } from "bun";
import Elysia, { t, file, error } from "elysia";
import { join } from "node:path";
import type { Children } from "@kitajs/html";
import { getIP } from "../helpers/elysia";
import staticPlugin from "@elysiajs/static";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";

export const appRouterPlugin = new Elysia({
	name: "appRouter"
});

// Base directories
const publicAppsDir = "public/apps";
const appsDir = "apps";
const htmlDir = join(publicAppsDir, "html");
const tsxDir = join(publicAppsDir, "tsx");

// Globs for discovery
const tsxGlob = new Glob("*.tsx");
const htmlGlob = new Glob("*.html");
const folderGlob = new Glob("*/index.html");

// Discover apps from both directories
async function discoverApps() {
	const htmlApps = new Map<string, string>();
	const folderApps = new Map<string, string>();
	const tsxApps = new Map<string, string>();

	try {
		// HTML files in public/apps/html
		for await (const file of htmlGlob.scan(htmlDir)) {
			const name = file.replace(".html", "");
			htmlApps.set(name, join(htmlDir, file));
		}

		// TSX files in public/apps/tsx
		for await (const file of tsxGlob.scan(tsxDir)) {
			const name = file.replace(".tsx", "");
			tsxApps.set(name, join(tsxDir, file));
		}

		// App folders in public/apps (excluding html and tsx subdirs)
		for await (const indexPath of folderGlob.scan(publicAppsDir)) {
			const pathParts = indexPath.split(/[/\\\\]/);
			const folderName = pathParts[0];
			if (!["html", "tsx"].includes(folderName)) {
				folderApps.set(folderName, join(publicAppsDir, indexPath));
			}
		}

		// App folders in /apps - normalize to track source vs built paths consistently
		for await (const indexPath of folderGlob.scan(appsDir)) {
			const pathParts = indexPath.split(/[/\\\\]/);
			const folderName = pathParts[0];
			if (!folderApps.has(folderName)) {
				// Store original source path for proper routing logic
				const originalPath = join(appsDir, indexPath);
				console.log(
					`[APP_ROUTER] Found source app in /apps: ${folderName} -> ${originalPath}`
				);
				folderApps.set(folderName, originalPath);
			}
		}

		console.log(
			`[APP_ROUTER] Discovered: ${htmlApps.size} HTML, ${tsxApps.size} TSX, ${folderApps.size} folder apps`
		);

		// Debug: Log all folder app paths for troubleshooting
		console.log("[APP_ROUTER] Discovered folder app paths:");
		for (const [name, path] of folderApps.entries()) {
			console.log(`  ${name}: ${path}`);
		}
	} catch (error) {
		console.error("[APP_ROUTER] Discovery error:", error);
	}

	return { htmlApps, folderApps, tsxApps };
}

// Enhanced TSX compilation with proper React setup
async function compileTsx(tsxPath: string, appName: string) {
	try {
		// Read the original TSX file
		const originalContent = await Bun.file(tsxPath).text();

		// Add React JSX pragma to force React JSX transform
		const modifiedContent = `/** @jsx React.createElement */
/** @jsxImportSource react */
${originalContent}`;

		// Create a temporary file with the modified content
		const tempDir = join(process.cwd(), ".bun-tmp");
		await mkdir(tempDir, { recursive: true });
		const tempTsxPath = join(tempDir, `${appName}-temp.tsx`);
		await writeFile(tempTsxPath, modifiedContent);

		const result = await Bun.build({
			entrypoints: [tempTsxPath],
			target: "browser",
			format: "esm",
			minify: false,
			define: {
				"process.env.NODE_ENV": '"production"'
			},
			external: ["react", "react-dom"],
			naming: "[name].[ext]"
		});

		if (!result.success) {
			console.error("[TSX_COMPILE] Build failed:", result.logs);
			throw new Error("TSX compilation failed");
		}

		let js = await result.outputs[0].text();

		// Remove problematic 'this' references from JSX - more comprehensive patterns
		js = js.replace(
			/,\s*undefined,\s*false,\s*undefined,\s*this\)/g,
			", undefined, false, undefined, undefined)"
		);
		js = js.replace(
			/,\s*undefined,\s*true,\s*undefined,\s*this\)/g,
			", undefined, true, undefined, undefined)"
		);
		js = js.replace(/,\s*this\)/g, ", undefined)");
		js = js.replace(/\(\s*this\)/g, "(undefined)");
		js = js.replace(/\bthis\b(?=\s*[,\)])/g, "undefined");

		// Also replace any remaining 'this' in JSX context
		js = js.replace(/\$jsxDEV\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*this\)/g, match => {
			return match.replace(", this)", ", undefined)");
		});

		console.log("[TSX_COMPILE] Compilation successful, JS length:", js.length);

		// Ensure .bun-tmp directory exists
		const bunTmpDir = join(process.cwd(), ".bun-tmp");
		await mkdir(bunTmpDir, { recursive: true });
		const tmp = await mkdtemp(join(bunTmpDir, `${appName}-`));
		const filePath = join(tmp, "component.mjs");

		await writeFile(filePath, js);

		const mod = await import(`file://${filePath}`);

		const default1 = mod.default;
		// Create a modern, styled HTML wrapper

		return (
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<title>
						${appName.charAt(0).toUpperCase() + appName.slice(1).replace(/-/g, " ")} |
						Synq Apps
					</title>
					<link
						rel="icon"
						type="image/png"
						href="/icons/favicon-96x96.png"
						sizes="96x96"
					/>
					<script src="https://unpkg.com/react@18/umd/react.production.min.js" />
					<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" />
					<script src="https://cdn.tailwindcss.com" />
					<style>{`
						* {box-sizing: border-box; }
						body {
							margin: 0;
						font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
						background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
						min-height: 100vh;
    }
						.synq-app-container {
							min-height: 100vh;
						display: flex;
						flex-direction: column;
    }
						.synq-app-header {
							background: rgba(15, 15, 35, 0.9);
						backdrop-filter: blur(10px);
						border-bottom: 1px solid rgba(255, 255, 255, 0.1);
						padding: 0.75rem 1rem;
						display: flex;
						align-items: center;
						justify-content: space-between;
						position: sticky;
						top: 0;
						z-index: 1000;
    }
						.synq-app-title {
							color: #ffffff;
						font-size: 1rem;
						font-weight: 600;
						margin: 0;
						display: flex;
						align-items: center;
						gap: 0.5rem;
    }
						.synq-app-badge {
							background: rgba(139, 92, 246, 0.2);
						color: #a855f7;
						padding: 0.25rem 0.5rem;
						border-radius: 0.375rem;
						font-size: 0.75rem;
						font-weight: 500;
    }
						.synq-back-btn {
							background: rgba(255, 255, 255, 0.1);
						border: 1px solid rgba(255, 255, 255, 0.2);
						color: #ffffff;
						padding: 0.5rem 1rem;
						border-radius: 0.5rem;
						text-decoration: none;
						font-size: 0.875rem;
						transition: all 0.2s;
    }
						.synq-back-btn:hover {
							background: rgba(255, 255, 255, 0.2);
						transform: translateY(-1px);
    }
					`}</style>
				</head>
				<body>
					<div class="synq-app-container">
						<header class="synq-app-header">
							<h1 class="synq-app-title">
								⚡ $
								{appName.charAt(0).toUpperCase() +
									appName.slice(1).replace(/-/g, " ")}
								<span class="synq-app-badge">TSX</span>
							</h1>
							<a href="/apps" class="synq-back-btn">
								← Gallery
							</a>
						</header>
						<main style="flex: 1;">
							<div id="root" />
						</main>
					</div>
					<script type="module">
						{`
// Wait for React to be available
if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
	console.error('React or ReactDOM not loaded');
} else {
	console.log('React and ReactDOM are available');
	
	// Create import maps for React
	const importMap = document.createElement('script');
	importMap.type = 'importmap';
	importMap.textContent = JSON.stringify({
		imports: {
			'react': 'data:text/javascript,export default window.React; export const useState = window.React.useState; export const useEffect = window.React.useEffect; export const useContext = window.React.useContext; export const useReducer = window.React.useReducer; export const useCallback = window.React.useCallback; export const useMemo = window.React.useMemo; export const useRef = window.React.useRef; export const createElement = window.React.createElement;',
			'react-dom': 'data:text/javascript,export default window.ReactDOM; export const render = window.ReactDOM.render; export const createRoot = window.ReactDOM.createRoot;',
			'react/jsx-runtime': 'data:text/javascript,export const jsx = (type, props) => window.React.createElement(type, props, props?.children); export const jsxs = (type, props) => window.React.createElement(type, props, props?.children); export const Fragment = window.React.Fragment;'
		}
	});
	document.head.appendChild(importMap);
	
	// Create a blob URL from the bundled JS and import it
	const jsCode = \`${js}\`;
	const blob = new Blob([jsCode], { type: 'application/javascript' });
	const moduleUrl = URL.createObjectURL(blob);

	// Dynamically import the component
	import(moduleUrl).then((module) => {
		const Component = module.default;
		
		// Mount the component
		const rootElement = document.getElementById('root');
		if (rootElement && Component) {
			console.log('Component loaded successfully');
			
			try {
				if (ReactDOM.createRoot) {
					const root = ReactDOM.createRoot(rootElement);
					root.render(React.createElement(Component));
				} else {
					ReactDOM.render(React.createElement(Component), rootElement);
				}
				console.log('Component mounted successfully');
			} catch (error) {
				console.error('Error mounting component:', error);
			}
		} else {
			console.error('Component not found or root element missing');
		}
		
		// Clean up the blob URL
		URL.revokeObjectURL(moduleUrl);
	}).catch((error) => {
		console.error('Failed to import component:', error);
	});
}
						`}
					</script>
				</body>
			</html>
		);
	} catch (error) {
		console.error("[TSX_COMPILE] Error:", error);
		return new Response(
			`
			<html>
				<head><title>TSX Compilation Error</title></head>
				<body style="font-family: monospace; padding: 2rem; background: #1a1a1a; color: #fff;">
					<h1 style="color: #ff6b6b;">TSX Compilation Error</h1>
					<p>Failed to compile <strong>${appName}</strong></p>
					<pre style="background: #2a2a2a; padding: 1rem; border-radius: 8px; overflow: auto;">${error}</pre>
					<a href="/apps" style="color: #8b5cf6;">← Back to Gallery</a>
				</body>
			</html>
		`,
			{
				status: 500,
				headers: {
					"Content-Type": "text/html; charset=utf-8"
				}
			}
		);
	}
}

// Enable HTML plugin for JSX support
appRouterPlugin.use(html());

// Test route for debugging
appRouterPlugin.get("/test-asset", async () => {
	console.log("[APP_ROUTER] Test route hit!");
	return new Response("Test route working", { status: 200 });
});

// Helper function to determine MIME type from file extension
function getMimeType(fileName: string): string {
	if (fileName.endsWith(".css")) return "text/css";
	if (fileName.endsWith(".js") || fileName.endsWith(".mjs")) return "application/javascript";
	if (fileName.endsWith(".json")) return "application/json";
	if (fileName.endsWith(".svg")) return "image/svg+xml";
	if (fileName.endsWith(".png")) return "image/png";
	if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
	if (fileName.endsWith(".webp")) return "image/webp";
	if (fileName.endsWith(".woff") || fileName.endsWith(".woff2")) return "font/woff2";
	if (fileName.endsWith(".ttf")) return "font/ttf";
	if (fileName.endsWith(".mp3")) return "audio/mpeg";
	if (fileName.endsWith(".mp4")) return "video/mp4";
	if (fileName.endsWith(".eot")) return "application/vnd.ms-fontobject";
	if (fileName.endsWith(".ico")) return "image/x-icon";
	if (fileName.endsWith(".gif")) return "image/gif";
	if (fileName.endsWith(".html")) return "text/html";
	if (fileName.endsWith(".txt")) return "text/plain";
	return "application/octet-stream";
}

// General asset route handling - catches all subdirectories within apps
appRouterPlugin.get("/apps/:name/*", async ({ params, request }) => {
	const { name: appName } = params;
	const wildcardPath = params["*"] || "";

	// Use the wildcard path directly instead of parsing URL, and decode any URL encoding
	const subPath = decodeURIComponent(wildcardPath);
	const fileName = subPath.split("/").pop() || "";

	// Only handle requests that look like asset files (have an extension)
	if (!fileName.includes(".")) {
		return; // Let app route handler take this
	}

	const assetPath = `public/apps/${appName}/${subPath}`;

	console.log(
		`[APP_ROUTER] General asset route hit - App: ${appName}, SubPath: ${subPath}, Path: ${assetPath}`
	);

	try {
		const file = Bun.file(assetPath);
		if (await file.exists()) {
			const content = await file.arrayBuffer();
			const mimeType = getMimeType(fileName);

			console.log(`[APP_ROUTER] Serving ${assetPath} with MIME type: ${mimeType}`);

			return new Response(content, {
				headers: {
					"Content-Type": mimeType,
					"Cache-Control": "no-cache"
				}
			});
		}

		console.log(`[APP_ROUTER] Asset file not found: ${assetPath}`);
	} catch (error) {
		console.error(`[APP_ROUTER] Error serving asset ${assetPath}:`, error);
	}

	// Don't return 404 here, let other routes try to handle it
	return;
});

// Explicit asset route handling for /assets/ subdirectory (kept for backward compatibility)
appRouterPlugin.get("/apps/:name/assets/:assetFile", async ({ params }) => {
	const { name: appName, assetFile } = params;
	const assetPath = `public/apps/${appName}/assets/${assetFile}`;

	console.log(
		`[APP_ROUTER] Legacy asset route hit - App: ${appName}, File: ${assetFile}, Path: ${assetPath}`
	);

	try {
		const file = Bun.file(assetPath);
		if (await file.exists()) {
			const content = await file.arrayBuffer();
			const mimeType = getMimeType(assetFile);

			console.log(`[APP_ROUTER] Serving ${assetPath} with MIME type: ${mimeType}`);

			return new Response(content, {
				headers: {
					"Content-Type": mimeType,
					"Cache-Control": "no-cache"
				}
			});
		}

		console.log(`[APP_ROUTER] Asset file not found: ${assetPath}`);
	} catch (error) {
		console.error(`[APP_ROUTER] Error serving asset ${assetPath}:`, error);
	}

	return new Response("Asset not found", { status: 404 });
});

// Special asset route for beach app (uses /beach/assets/ instead of /apps/beach/assets/)
appRouterPlugin.get("/beach2/assets/:assetFile", async ({ params }) => {
	const { assetFile } = params;
	const assetPath = `public/apps/beach/assets/${assetFile}`;

	console.log(`[APP_ROUTER] Beach asset route hit - File: ${assetFile}, Path: ${assetPath}`);

	try {
		const file = Bun.file(assetPath);
		if (await file.exists()) {
			const content = await file.arrayBuffer();
			const mimeType = getMimeType(assetFile);

			console.log(
				`[APP_ROUTER] Serving beach asset ${assetPath} with MIME type: ${mimeType}`
			);

			return new Response(content, {
				headers: {
					"Content-Type": mimeType,
					"Cache-Control": "no-cache"
				}
			});
		}

		console.log(`[APP_ROUTER] Beach asset file not found: ${assetPath}`);
	} catch (error) {
		console.error(`[APP_ROUTER] Error serving beach asset ${assetPath}:`, error);
	}

	return new Response("Beach asset not found", { status: 404 });
});

// Static plugins for serving assets
appRouterPlugin.use(
	staticPlugin({
		assets: "public",
		prefix: "/",
		noCache: true,
		directive: "no-cache",
		maxAge: 0
	})
);

// Beautiful Gallery route with server-side rendered JSX
appRouterPlugin.get("/apps", async ({ request }) => {
	try {
		const context = (request as unknown as Record<string, unknown>).__context as RequestContext;
		const { htmlApps, folderApps, tsxApps } = await discoverApps();

		const appData = {
			htmlAppsList: Array.from(htmlApps.keys()),
			folderAppsList: Array.from(folderApps.keys()),
			tsxAppsList: Array.from(tsxApps.keys()),
			totalCount: htmlApps.size + folderApps.size + tsxApps.size
		};

		const currentTime = new Date().toLocaleString();
		// Server-side rendered JSX gallery with gorgeous styling
		return (
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<title>Synq Chat-App Gallery</title>
					<link
						rel="icon"
						type="image/png"
						href="/icons/favicon-96x96.png"
						sizes="96x96"
					/>
					<script src="https://unpkg.com/react@18/umd/react.production.min.js" />
					<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" />
					<script src="https://cdn.tailwindcss.com" />
					<style>{`
   					@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
   					
   					* { box-sizing: border-box; }
   					
   					body {
   						margin: 0;
   						font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
   						background: #0a0a0a;
   						color: #ffffff;
   						line-height: 1.6;
   						-webkit-font-smoothing: antialiased;
   						-moz-osx-font-smoothing: grayscale;
   					}
   					
   					.bg-grid-pattern {
   						background-image: 
   							linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
   							linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
   						background-size: 50px 50px;
   					}
   					
   					.gradient-text {
   						background: linear-gradient(135deg, #8b5cf6, #06b6d4);
   						-webkit-background-clip: text;
   						-webkit-text-fill-color: transparent;
   						background-clip: text;
   					}
   					
   					.glass {
   						background: rgba(20, 20, 20, 0.8);
   						backdrop-filter: blur(16px);
   						-webkit-backdrop-filter: blur(16px);
   						border: 1px solid rgba(255, 255, 255, 0.1);
   					}
   					
   					.glass-surface {
   						background: rgba(26, 26, 26, 0.9);
   						backdrop-filter: blur(20px);
   						-webkit-backdrop-filter: blur(20px);
   						border: 1px solid rgba(255, 255, 255, 0.05);
   					}
   					
   					.app-card {
   						background: rgba(26, 26, 26, 0.95);
   						border: 1px solid rgba(255, 255, 255, 0.1);
   						border-radius: 16px;
   						padding: 24px;
   						transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
   					}
   					
   					.app-card:hover {
   						border-color: rgba(139, 92, 246, 0.5);
   						transform: translateY(-8px) scale(1.02);
   						box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
   					}
   					
   					.app-icon {
   						width: 48px;
   						height: 48px;
   						border-radius: 12px;
   						display: flex;
   						align-items: center;
   						justify-content: center;
   						margin-bottom: 16px;
   						font-size: 20px;
   					}
   					
   					.tsx-icon { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #ffffff; }
   					.folder-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #ffffff; }
   					.html-icon { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; }
   					
   					.btn-primary {
   						background: linear-gradient(135deg, #8b5cf6, #06b6d4);
   						color: white;
   						border: none;
   						border-radius: 12px;
   						padding: 12px 24px;
   						font-weight: 600;
   						text-decoration: none;
   						display: inline-flex;
   						align-items: center;
   						gap: 8px;
   						transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   						cursor: pointer;
   					}
   					
   					.btn-primary:hover {
   						transform: translateY(-2px);
   						box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
   					}
   					
   					.btn-secondary {
   						background: rgba(255, 255, 255, 0.1);
   						color: #ffffff;
   						border: 1px solid rgba(255, 255, 255, 0.2);
   						border-radius: 12px;
   						padding: 8px 16px;
   						font-weight: 500;
   						text-decoration: none;
   						display: inline-flex;
   						align-items: center;
   						gap: 8px;
   						transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   						cursor: pointer;
   						font-size: 14px;
   					}
   					
   					.btn-secondary:hover {
   						background: rgba(255, 255, 255, 0.2);
   						transform: translateY(-1px);
   					}
   					
   					.status-indicator {
   						width: 8px;
   						height: 8px;
   						border-radius: 50%;
   						margin-right: 8px;
   					}
   					
   					.status-live { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
   					.status-tsx { background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
   					.status-html { background: #06b6d4; box-shadow: 0 0 10px rgba(6, 182, 212, 0.5); }
   					
   					.pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
   					
   					@keyframes pulse-glow {
   						0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
   						50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); }
   					}
   					
   					@keyframes fade-in {
   						from { opacity: 0; transform: translateY(30px); }
   						to { opacity: 1; transform: translateY(0); }
   					}
   					
   					.fade-in { animation: fade-in 0.8s ease-out; }
   					
   					/* Utility classes */
   					.grid { display: grid; }
   					.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
   					.gap-8 { gap: 2rem; }
   					.gap-6 { gap: 1.5rem; }
   					.max-w-7xl { max-width: 80rem; }
   					.mx-auto { margin-left: auto; margin-right: auto; }
   					.px-4 { padding-left: 1rem; padding-right: 1rem; }
   					.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
   					.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
   					.mb-20 { margin-bottom: 5rem; }
   					.mb-12 { margin-bottom: 3rem; }
   					.mb-8 { margin-bottom: 2rem; }
   					.mb-6 { margin-bottom: 1.5rem; }
   					.mb-4 { margin-bottom: 1rem; }
   					.mb-2 { margin-bottom: 0.5rem; }
   					.text-center { text-align: center; }
   					.text-6xl { font-size: 3.75rem; line-height: 1; }
   					.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
   					.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
   					.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
   					.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
   					.text-xs { font-size: 0.75rem; line-height: 1rem; }
   					.font-bold { font-weight: 700; }
   					.font-semibold { font-weight: 600; }
   					.font-medium { font-weight: 500; }
   					.text-gray-300 { color: #d1d5db; }
   					.text-gray-400 { color: #9ca3af; }
   					.text-gray-500 { color: #6b7280; }
   					.text-yellow-400 { color: #facc15; }
   					.text-green-400 { color: #4ade80; }
   					.text-cyan-400 { color: #22d3ee; }
   					.bg-yellow-400\\/20 { background-color: rgba(250, 204, 21, 0.2); }
   					.bg-green-400\\/20 { background-color: rgba(74, 222, 128, 0.2); }
   					.bg-cyan-400\\/20 { background-color: rgba(34, 211, 238, 0.2); }
   					.bg-green-500\\/20 { background-color: rgba(34, 197, 94, 0.2); }
   					.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
   					.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
   					.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
   					.rounded-full { border-radius: 9999px; }
   					.rounded-2xl { border-radius: 1rem; }
   					.flex { display: flex; }
   					.items-center { align-items: center; }
   					.justify-center { justify-content: center; }
   					.justify-between { justify-content: space-between; }
   					.space-x-4 > * + * { margin-left: 1rem; }
   					.space-x-2 > * + * { margin-left: 0.5rem; }
   					.flex-wrap { flex-wrap: wrap; }
   					.relative { position: relative; }
   					.absolute { position: absolute; }
   					.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
   					.overflow-hidden { overflow: hidden; }
   					.sticky { position: sticky; }
   					.top-0 { top: 0; }
   					.z-50 { z-index: 50; }
   					.h-16 { height: 4rem; }
   					.border-b { border-bottom-width: 1px; }
   					.border-white\\/10 { border-color: rgba(255, 255, 255, 0.1); }
   					.border-t { border-top-width: 1px; }
   					.text-2xl { font-size: 1.5rem; line-height: 2rem; }
   					.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
   					.opacity-75 { opacity: 0.75; }
   					.capitalize { text-transform: capitalize; }
   					.w-full { width: 100%; }
   					.w-8 { width: 2rem; }
   					.h-8 { height: 2rem; }
   					.bg-white\\/5 { background-color: rgba(255, 255, 255, 0.05); }
   					.rounded-lg { border-radius: 0.5rem; }
   					.mr-4 { margin-right: 1rem; }
   					.ml-4 { margin-left: 1rem; }
   					.mt-1 { margin-top: 0.25rem; }
   					.bg-gray-800 { background-color: #1f2937; }
   					.mt-20 { margin-top: 5rem; }
   					.flex-col { flex-direction: column; }
   					.min-w-32 { min-width: 8rem; }
   					.p-6 { padding: 1.5rem; }
   					
   					@media (min-width: 640px) {
   						.sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
   					}
   					
   					@media (min-width: 768px) {
   						.md\\:text-8xl { font-size: 6rem; line-height: 1; }
   						.md\\:flex-row { flex-direction: row; }
   						.md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
   					}
   					
   					@media (min-width: 1024px) {
   						.lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
   						.lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
   						.lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
   					}
   				`}</style>
				</head>
				<body class="bg-grid-pattern">
					{/* Navigation */}
					<nav class="glass sticky top-0 z-50 border-b border-white/10">
						<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div class="flex items-center justify-between h-16">
								<div class="flex items-center space-x-4">
									<div class="text-2xl">🦊</div>
									<h1 class="text-xl font-semibold">Synq Chat</h1>
									<div class="status-indicator status-live pulse-glow" />
								</div>
								<div class="flex items-center space-x-4">
									<span class="text-sm opacity-75">{currentTime}</span>
									<span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
										{context?.ip || "localhost"}
									</span>
								</div>
							</div>
						</div>
					</nav>

					{/* Hero Section */}
					<div class="relative overflow-hidden">
						<div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20" />
						<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
							<div class="text-center fade-in">
								<h1 class="text-6xl md:text-8xl font-bold mb-6">
									<span class="gradient-text">App Gallery</span>
								</h1>
								<p class="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
									Discover and explore our collection of dynamic applications and
									interactive experiences. Built with modern web technologies and
									powered by Bun + Elysia.js.
								</p>

								<div class="flex flex-wrap justify-center gap-6 mb-12">
									<div class="glass-surface rounded-2xl p-6 min-w-32">
										<div class="text-3xl font-bold gradient-text">
											{appData.folderAppsList.length}
										</div>
										<div class="text-sm text-gray-400 mt-1">Full Apps</div>
									</div>
									<div class="glass-surface rounded-2xl p-6 min-w-32">
										<div class="text-3xl font-bold gradient-text">
											{appData.tsxAppsList.length}
										</div>
										<div class="text-sm text-gray-400 mt-1">TSX Apps</div>
									</div>
									<div class="glass-surface rounded-2xl p-6 min-w-32">
										<div class="text-3xl font-bold gradient-text">
											{appData.htmlAppsList.length}
										</div>
										<div class="text-sm text-gray-400 mt-1">HTML Pages</div>
									</div>
									<div class="glass-surface rounded-2xl p-6 min-w-32">
										<div class="text-3xl font-bold gradient-text">∞</div>
										<div class="text-sm text-gray-400 mt-1">Possibilities</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
						{/* TSX Applications */}
						{appData.tsxAppsList.length > 0 && (
							<div class="mb-20">
								<h2 class="text-4xl font-bold mb-4 flex items-center">
									<span class="mr-4">⚡</span>
									TSX Applications
									<span class="ml-4 text-xs bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full font-medium">
										COMPILED
									</span>
								</h2>
								<p class="text-gray-400 mb-8 text-lg">
									React components compiled on-the-fly with Bun's blazing fast
									transpiler
								</p>

								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{appData.tsxAppsList.map((appName, index) => (
										// biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
										<div class="app-card fade-in">
											<div class="flex items-start justify-between mb-4">
												<div class="app-icon tsx-icon">⚡</div>
												<div class="flex items-center">
													<div class="status-indicator status-tsx" />
													<span class="text-xs text-yellow-400 font-medium">
														TSX
													</span>
												</div>
											</div>

											<h3 class="text-xl font-semibold mb-2 capitalize">
												{appName.replace(/-/g, " ")}
											</h3>
											<p class="text-gray-400 mb-6 text-sm">
												React TSX application with modern hooks and state
												management, compiled instantly.
											</p>

											<div class="flex items-center justify-between">
												<a href={`/apps/${appName}`} class="btn-primary">
													Launch App
													<span>→</span>
												</a>
												<div class="flex space-x-2">
													<div class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
														<span style="font-size: 14px;">📱</span>
													</div>
													<div class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
														<span style="font-size: 14px;">💻</span>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Full Applications */}
						{appData.folderAppsList.length > 0 && (
							<div class="mb-20">
								<h2 class="text-4xl font-bold mb-4 flex items-center">
									<span class="mr-4">🚀</span>
									Interactive Applications
									<span class="ml-4 text-xs bg-green-400/20 text-green-400 px-3 py-1 rounded-full font-medium">
										LIVE
									</span>
								</h2>
								<p class="text-gray-400 mb-8 text-lg">
									Full-featured applications with complete functionality and
									modern UI
								</p>

								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{appData.folderAppsList.map((appName, index) => (
										// biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
										<div class="app-card fade-in">
											<div class="flex items-start justify-between mb-4">
												<div class="app-icon folder-icon">🚀</div>
												<div class="flex items-center">
													<div class="status-indicator status-live pulse-glow" />
													<span class="text-xs text-green-400 font-medium">
														LIVE
													</span>
												</div>
											</div>

											<h3 class="text-xl font-semibold mb-2 capitalize">
												{appName.replace(/-/g, " ")}
											</h3>
											<p class="text-gray-400 mb-6 text-sm">
												Complete interactive application with advanced
												features, real-time capabilities, and modern
												architecture.
											</p>

											<div class="flex items-center justify-between">
												<a href={`/apps/${appName}`} class="btn-primary">
													Launch App
													<span>→</span>
												</a>
												<div class="flex space-x-2">
													<div class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
														<span style="font-size: 14px;">📱</span>
													</div>
													<div class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
														<span style="font-size: 14px;">💻</span>
													</div>
													<div class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
														<span style="font-size: 14px;">🌐</span>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* HTML Experiences */}
						{appData.htmlAppsList.length > 0 && (
							<div class="mb-20">
								<h2 class="text-4xl font-bold mb-4 flex items-center">
									<span class="mr-4">🎨</span>
									Standalone Experiences
									<span class="ml-4 text-xs bg-cyan-400/20 text-cyan-400 px-3 py-1 rounded-full font-medium">
										HTML
									</span>
								</h2>
								<p class="text-gray-400 mb-8 text-lg">
									Creative HTML experiences with unique interactions and visual
									effects
								</p>

								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
									{appData.htmlAppsList.map((appName, index) => (
										// biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
										<div class="app-card fade-in">
											<div class="flex items-start justify-between mb-4">
												<div class="app-icon html-icon">🎨</div>
												<div class="flex items-center">
													<div class="status-indicator status-html" />
													<span class="text-xs text-cyan-400 font-medium">
														HTML
													</span>
												</div>
											</div>

											<h3 class="text-lg font-semibold mb-2 capitalize">
												{appName.replace(/-/g, " ")}
											</h3>
											<p class="text-gray-400 mb-4 text-xs">
												Creative HTML experience with custom interactions
											</p>

											<a
												href={`/apps/${appName}`}
												class="btn-secondary w-full justify-center"
											>
												Open Experience
												<span>→</span>
											</a>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Empty State */}
						{appData.totalCount === 0 && (
							<div class="glass-surface rounded-2xl text-center py-20">
								<div class="text-6xl mb-6">📂</div>
								<h3 class="text-2xl font-bold mb-4">No Apps Available</h3>
								<p class="text-gray-400 mb-8">
									Check back later for new applications and experiences.
								</p>
								<div class="text-sm text-gray-500">
									Add apps to{" "}
									<code class="bg-gray-800 px-2 py-1 rounded">public/apps/</code>{" "}
									or <code class="bg-gray-800 px-2 py-1 rounded">apps/</code>
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<footer class="glass border-t border-white/10 mt-20">
						<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
							<div class="flex flex-col md:flex-row items-center justify-between">
								<div class="flex items-center space-x-4 mb-6 md:mb-0">
									<div class="text-3xl">🦊</div>
									<div>
										<div class="font-semibold text-lg">
											Synq Chat App Gallery
										</div>
										<div class="text-gray-400 text-sm">
											Powered by Bun + Elysia.js
										</div>
									</div>
								</div>
								<div class="flex items-center space-x-8 text-sm text-gray-400">
									<a href="/test" class="hover:text-white transition-colors">
										System Status
									</a>
									<a
										href="/rate-limit-status"
										class="hover:text-white transition-colors"
									>
										Rate Limits
									</a>
									<span>TSX • HTML • React • Tailwind</span>
								</div>
							</div>
						</div>
					</footer>
				</body>
			</html>
		);
	} catch (error) {
		console.error("[APP_ROUTER] Error serving gallery:", error);
		return (
			<html lang="en">
				<head>
					<title>Gallery Error</title>
					<style>
						{/* body {{ font-family: monospace; padding: 2rem; background: #1a1a1a; color: #fff; }}
					h1 {{ color: #ff6b6b; }}
					pre {{ background: #2a2a2a; padding: 1rem; border-radius: 8px; overflow: auto; }} */}
					</style>
				</head>
				<body>
					<h1>Gallery Error</h1>
					<p>Error: {String(error)}</p>
					<a href="/">← Back to Home</a>
				</body>
			</html>
		);
	}
});

// Helper function to resolve public file paths for static content optimization - Fixed for deployment
const publicApp = async (filename: string) => {
	try {
		const file = Bun.file(filename);
		const exists = await file.exists();

		if (!exists) {
			console.log(`[APP_ROUTER] File not found: ${filename}`);
			return new Response("File not found", { status: 404 });
		}

		const content = await file.text();
		const mimeType = file.type || "text/html";

		return new Response(content, {
			headers: {
				"Content-Type": mimeType,
				"Cache-Control": "no-cache"
			}
		});
	} catch (error) {
		console.error(`[APP_ROUTER] Error serving file ${filename}:`, error);
		return new Response("Error reading file", { status: 500 });
	}
};

// Individual app routing with priority: folder apps > HTML files > TSX files
appRouterPlugin.get("/apps/:name", async ({ params, request, server }) => {
	const { name: appName } = params;

	// Skip if this is an asset request or contains a file extension
	if (appName.includes(".") || appName.includes("/")) {
		// Let static plugin handle assets and other file requests
		return;
	}

	const { htmlApps, folderApps, tsxApps } = await discoverApps();

	console.log(`[APP_ROUTER] Routing request for app: ${appName}`);
	console.log(`[APP_ROUTER] Available folder apps: ${Array.from(folderApps.keys()).join(", ")}`);
	console.log(`[APP_ROUTER] Available HTML apps: ${Array.from(htmlApps.keys()).join(", ")}`);
	console.log(`[APP_ROUTER] Available TSX apps: ${Array.from(tsxApps.keys()).join(", ")}`);

	// Priority 1: Folder apps (full applications)
	if (folderApps.has(appName)) {
		const folderPath = folderApps.get(appName);
		console.log(`[APP_ROUTER] Serving folder app: ${folderPath}`);

		// Enhanced path resolution - always try built version first, then fallback
		const publicPath = join("public", "apps", appName, "index.html");
		const publicFile = Bun.file(publicPath);

		if (await publicFile.exists()) {
			console.log(`[APP_ROUTER] Serving ${appName} from built public version: ${publicPath}`);
			return await publicApp(publicPath);
		}

		// If this app is in the /apps directory (source), check if built version exists
		if (folderPath?.startsWith("apps/")) {
			console.log(
				`[APP_ROUTER] App ${appName} is in source /apps directory, no built version found`
			);
			console.log(`[APP_ROUTER] Serving from source: ${folderPath}`);
			return await publicApp(folderPath as string);
		}

		// For apps already in public/apps, serve directly
		console.log(`[APP_ROUTER] Serving ${appName} from: ${folderPath}`);
		return await publicApp(folderPath as string);
	}

	// Priority 2: HTML files (standalone experiences)
	if (htmlApps.has(appName)) {
		const htmlPath = htmlApps.get(appName);
		console.log(`[APP_ROUTER] Serving HTML file: ${htmlPath}`);
		return await publicApp(htmlPath as string);
	}

	// Priority 3: TSX apps (compiled React components)
	if (tsxApps.has(appName)) {
		const tsxPath = tsxApps.get(appName);
		console.log(`[APP_ROUTER] Compiling TSX app: ${tsxPath}`);
		return await compileTsx(tsxPath as string, appName);
		// const app = (await Bun.file(tsxPath as string).text()) as JSX.Element;
		// return (<Base title={name} version="1.0.0" ip={getIP(request, server) || 'localhost'}>
		// 	{app}
		// </Base>);
		// return (;
	}

	// Not found-redirect to gallery
	console.log(`[APP_ROUTER] App not found: ${appName}, redirecting to gallery`);
	return Response.redirect("/apps", 302);
});

// Log discovered apps on plugin initialization
const { htmlApps, folderApps, tsxApps } = await discoverApps();
console.log(
	`[APP_ROUTER] ✅ Ready! Found ${htmlApps.size + folderApps.size + tsxApps.size} apps total`
);
console.log(`[APP_ROUTER] 📁 Folder apps: ${Array.from(folderApps.keys()).join(", ") || "none"}`);
console.log(`[APP_ROUTER] ⚡ TSX apps: ${Array.from(tsxApps.keys()).join(", ") || "none"}`);
console.log(`[APP_ROUTER] 🎨 HTML apps: ${Array.from(htmlApps.keys()).join(", ") || "none"}`);
console.log("[APP_ROUTER] 🎨 Gallery served at /apps using Elysia native JSX rendering");
