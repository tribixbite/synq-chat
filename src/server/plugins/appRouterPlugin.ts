import { staticPlugin } from "@elysiajs/static";
import Elysia from "elysia";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

// Dynamic app router plugin that auto-discovers apps and creates beautiful gallery
export const appRouterPlugin = new Elysia({ name: "dynamicAppRouter" });

const appsDir = resolve(process.cwd(), "public/apps");

// Function to generate beautiful HTML gallery using Bun.html
function generateAppGallery(appDirectories: string[], htmlFiles: string[]): string {
	const currentTime = new Date().toLocaleString();

	return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Synq Chat - App Gallery</title>
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
	<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
		
		body {
			font-family: 'Inter', sans-serif;
		}
		
		.gradient-bg {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		}
		
		.glass {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.2);
		}
		
		.card-hover {
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}
		
		.card-hover:hover {
			transform: translateY(-8px) scale(1.02);
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		}
		
		.animate-float {
			animation: float 6s ease-in-out infinite;
		}
		
		@keyframes float {
			0%, 100% { transform: translateY(0px); }
			50% { transform: translateY(-10px); }
		}
		
		.animate-fade-in {
			animation: fadeIn 0.6s ease-out forwards;
		}
		
		@keyframes fadeIn {
			from { opacity: 0; transform: translateY(20px); }
			to { opacity: 1; transform: translateY(0); }
		}
	</style>
</head>
<body class="min-h-screen bg-gray-900 text-white">
	<div class="gradient-bg min-h-screen">
		<!-- Navigation -->
		<nav class="glass sticky top-0 z-50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between h-16">
					<div class="flex items-center space-x-4">
						<div class="text-2xl font-bold">🦊</div>
						<h1 class="text-xl font-semibold">Synq Chat</h1>
					</div>
					<div class="flex items-center space-x-4">
						<span class="text-sm opacity-75">${currentTime}</span>
						<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
					</div>
				</div>
			</div>
		</nav>

		<!-- Hero Section -->
		<div class="relative overflow-hidden">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div class="text-center">
					<h1 class="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
						<span class="bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
							App Gallery
						</span>
					</h1>
					<p class="text-xl text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in">
						Discover and explore our collection of dynamic applications and interactive experiences.
						Built with modern web technologies and optimized for performance.
					</p>
					<div class="flex flex-wrap justify-center gap-4 animate-fade-in">
						<div class="glass rounded-lg px-4 py-2">
							<span class="text-sm font-medium">${appDirectories.length} Applications</span>
						</div>
						<div class="glass rounded-lg px-4 py-2">
							<span class="text-sm font-medium">${htmlFiles.length} Experiences</span>
						</div>
						<div class="glass rounded-lg px-4 py-2">
							<span class="text-sm font-medium">Real-time Updates</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Apps Grid -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
			<!-- Directory-based Apps -->
			${
				appDirectories.length > 0
					? `
			<div class="mb-16">
				<h2 class="text-3xl font-bold mb-8 flex items-center">
					<i data-lucide="folder" class="mr-3"></i>
					Interactive Applications
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					${appDirectories
						.map(
							(appDir, index) => `
						<div class="glass rounded-2xl p-6 card-hover animate-fade-in" style="animation-delay: ${index * 0.1}s">
							<div class="flex items-start justify-between mb-4">
								<div class="w-12 h-12 glass rounded-xl flex items-center justify-center animate-float" style="animation-delay: ${index * 0.5}s">
									<i data-lucide="layout-dashboard" class="w-6 h-6 text-blue-400"></i>
								</div>
								<div class="flex items-center space-x-2">
									<div class="w-2 h-2 bg-green-400 rounded-full"></div>
									<span class="text-xs text-green-400 font-medium">LIVE</span>
								</div>
							</div>
							<h3 class="text-xl font-semibold mb-2 capitalize">${appDir.replace(/-/g, " ")}</h3>
							<p class="text-gray-400 text-sm mb-4">
								Interactive application with full functionality and modern UI components.
							</p>
							<div class="flex items-center justify-between">
								<a href="/apps/${appDir}" 
								   class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
								          px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105">
									Launch App
								</a>
								<div class="flex space-x-2">
									<div class="w-8 h-8 glass rounded-lg flex items-center justify-center">
										<i data-lucide="smartphone" class="w-4 h-4"></i>
									</div>
									<div class="w-8 h-8 glass rounded-lg flex items-center justify-center">
										<i data-lucide="monitor" class="w-4 h-4"></i>
									</div>
								</div>
							</div>
						</div>
					`
						)
						.join("")}
				</div>
			</div>
			`
					: ""
			}

			<!-- HTML-based Experiences -->
			${
				htmlFiles.length > 0
					? `
			<div>
				<h2 class="text-3xl font-bold mb-8 flex items-center">
					<i data-lucide="code" class="mr-3"></i>
					Standalone Experiences
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					${htmlFiles
						.map((htmlFile, index) => {
							const name = basename(htmlFile, ".html");
							return `
						<div class="glass rounded-xl p-4 card-hover animate-fade-in" style="animation-delay: ${(appDirectories.length + index) * 0.1}s">
							<div class="w-10 h-10 glass rounded-lg flex items-center justify-center mb-3 animate-float" style="animation-delay: ${index * 0.3}s">
								<i data-lucide="file-text" class="w-5 h-5 text-purple-400"></i>
							</div>
							<h3 class="font-semibold mb-2 capitalize text-sm">${name.replace(/-/g, " ")}</h3>
							<p class="text-gray-400 text-xs mb-3">Standalone HTML experience</p>
							<a href="/apps/${name}" 
							   class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 
							          px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 transform hover:scale-105 w-full text-center block">
								Open
							</a>
						</div>
						`;
						})
						.join("")}
				</div>
			</div>
			`
					: ""
			}

			<!-- Empty State -->
			${
				appDirectories.length === 0 && htmlFiles.length === 0
					? `
			<div class="text-center py-16">
				<div class="w-24 h-24 glass rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
					<i data-lucide="folder-open" class="w-12 h-12 text-gray-400"></i>
				</div>
				<h3 class="text-2xl font-semibold mb-2">No Apps Available</h3>
				<p class="text-gray-400">Check back later for new applications and experiences.</p>
			</div>
			`
					: ""
			}
		</div>

		<!-- Footer -->
		<footer class="glass mt-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div class="flex flex-col md:flex-row items-center justify-between">
					<div class="flex items-center space-x-4 mb-4 md:mb-0">
						<div class="text-2xl">🦊</div>
						<span class="font-medium">Synq Chat App Gallery</span>
					</div>
					<div class="flex items-center space-x-6 text-sm text-gray-400">
						<a href="/test" class="hover:text-white transition-colors">System Status</a>
						<a href="/rate-limit-status" class="hover:text-white transition-colors">Rate Limits</a>
						<span>Powered by Elysia & Bun</span>
					</div>
				</div>
			</div>
		</footer>
	</div>

	<script>
		// Initialize Lucide icons
		lucide.createIcons();
		
		// Add smooth scrolling and enhanced interactions
		document.querySelectorAll('a[href^="/apps/"]').forEach(link => {
			link.addEventListener('click', function(e) {
				// Add a loading state
				this.innerHTML = '<i data-lucide="loader-2" class="animate-spin inline w-4 h-4 mr-2"></i>Loading...';
				lucide.createIcons();
			});
		});

		// Add keyboard navigation
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape') {
				window.location.href = '/';
			}
		});

		// Progressive enhancement for touch devices
		if ('ontouchstart' in window) {
			document.body.classList.add('touch-device');
		}
	</script>
</body>
</html>`;
}

try {
	// Ensure apps directory exists
	if (!existsSync(appsDir)) {
		console.warn("[APP_ROUTER] Apps directory does not exist:", appsDir);
		// Create a minimal fallback
		appRouterPlugin.get("/apps", () => {
			return new Response(generateAppGallery([], []), {
				headers: { "Content-Type": "text/html" }
			});
		});
		appRouterPlugin.get("/apps/*", () => {
			return new Response(generateAppGallery([], []), {
				headers: { "Content-Type": "text/html" }
			});
		});
	} else {
		// Get all items in public/apps/
		const items = readdirSync(appsDir);

		// Separate directories from files, and handle the special 'html' directory
		const appDirectories: string[] = [];
		let htmlDirectory: string | null = null;
		let htmlFiles: string[] = [];

		for (const item of items) {
			const itemPath = resolve(appsDir, item);
			const itemStat = statSync(itemPath);

			if (itemStat.isDirectory()) {
				if (item === "html") {
					htmlDirectory = item;
				} else {
					appDirectories.push(item);
				}
			}
		}

		// Get HTML files if html directory exists
		if (htmlDirectory) {
			const htmlDir = resolve(appsDir, htmlDirectory);
			try {
				htmlFiles = readdirSync(htmlDir).filter(
					file => extname(file).toLowerCase() === ".html"
				);
			} catch (htmlError) {
				console.error("[APP_ROUTER] Error reading HTML directory", {
					error: (htmlError as Error).message,
					htmlDir
				});
			}
		}

		// Create the beautiful app gallery for /apps
		appRouterPlugin.get("/apps", () => {
			return new Response(generateAppGallery(appDirectories, htmlFiles), {
				headers: { "Content-Type": "text/html" }
			});
		});

		// Create static plugins for each app directory (except 'html')
		for (const appDir of appDirectories) {
			const appPath = `/apps/${appDir}`;
			const staticPath = resolve(appsDir, appDir);

			console.info("[APP_ROUTER] Registering app directory:", appDir, {
				path: appPath,
				staticPath
			});

			// Use static plugin for the app directory
			appRouterPlugin.use(
				staticPlugin({
					assets: `public/apps/${appDir}`,
					prefix: appPath,
					indexHTML: true,
					headers: {
						"Cache-Control": "public, max-age=3600"
					}
				})
			);

			// Add fallback route for unmatched paths within the app directory
			appRouterPlugin.get(`${appPath}/*`, () => {
				const indexPath = resolve(staticPath, "index.html");
				if (existsSync(indexPath)) {
					return Bun.file(indexPath);
				}
				// If no index.html, redirect to app gallery
				return Response.redirect("/apps", 302);
			});
		}

		// Handle standalone HTML files in public/apps/html/
		if (htmlDirectory && htmlFiles.length > 0) {
			const htmlDir = resolve(appsDir, htmlDirectory);

			for (const htmlFile of htmlFiles) {
				const fileName = basename(htmlFile, ".html");
				const appPath = `/apps/${fileName}`;
				const filePath = resolve(htmlDir, htmlFile);

				console.info("[APP_ROUTER] Registering standalone HTML app:", fileName, {
					path: appPath,
					filePath: htmlFile
				});

				// Serve the HTML file directly at /apps/{filename}
				appRouterPlugin.get(appPath, () => Bun.file(filePath));

				// Also serve with trailing slash for consistency
				appRouterPlugin.get(`${appPath}/`, () => Bun.file(filePath));
			}
		}

		// Fallback for any unmatched /apps/* routes
		appRouterPlugin.get("/apps/*", ({ request }) => {
			const url = new URL(request.url);
			const pathSegments = url.pathname.split("/").filter(Boolean);

			// If it's a request for a specific app that doesn't exist, show gallery
			if (pathSegments.length >= 2 && pathSegments[0] === "apps") {
				return Response.redirect("/apps", 302);
			}

			// Otherwise show the gallery
			return new Response(generateAppGallery(appDirectories, htmlFiles), {
				headers: { "Content-Type": "text/html" }
			});
		});

		console.info("[APP_ROUTER] Dynamic app router initialized", {
			appDirectories: appDirectories.length,
			htmlFiles: htmlFiles.length
		});
	}
} catch (error) {
	console.error("[APP_ROUTER] Error initializing dynamic app router", {
		error: (error as Error).message,
		appsDir
	});

	// Emergency fallback
	appRouterPlugin.get("/apps", () => {
		return new Response(generateAppGallery([], []), {
			headers: { "Content-Type": "text/html" }
		});
	});
}
