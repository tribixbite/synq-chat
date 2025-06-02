#!/usr/bin/env node

// Build verification script for Railway deployment
// Ensures all necessary files and directories are present

import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_FILES = [
	"public/apps/admin/index.html",
	"public/apps/vibesynq/index.html",
	"public/apps/beach",
	"public/apps/original",
	"public/apps/html"
];

const REQUIRED_DIRECTORIES = [
	"public",
	"public/apps",
	"public/apps/admin",
	"public/apps/vibesynq",
	"public/apps/beach",
	"public/apps/original",
	"public/apps/html"
];

console.log("🔍 Starting build verification...");

let allPassed = true;

// Check required directories
console.log("\n📁 Checking required directories:");
for (const dir of REQUIRED_DIRECTORIES) {
	const exists = existsSync(dir);
	console.log(`  ${exists ? "✅" : "❌"} ${dir}`);
	if (!exists) allPassed = false;
}

// Check required files
console.log("\n📄 Checking required files:");
for (const file of REQUIRED_FILES) {
	const exists = existsSync(file);
	console.log(`  ${exists ? "✅" : "❌"} ${file}`);
	if (!exists) allPassed = false;
}

// Count apps and experiences
console.log("\n🎯 App discovery verification:");
try {
	const appsDir = "public/apps";
	const items = readdirSync(appsDir);

	const appDirectories = [];
	let htmlFiles = [];

	for (const item of items) {
		const itemPath = resolve(appsDir, item);
		const itemStat = statSync(itemPath);

		if (itemStat.isDirectory()) {
			if (item === "html") {
				// Count HTML files in html directory
				try {
					const htmlDir = resolve(appsDir, "html");
					htmlFiles = readdirSync(htmlDir).filter(file => file.endsWith(".html"));
				} catch (error) {
					console.log(`  ⚠️  Could not read html directory: ${error.message}`);
				}
			} else {
				appDirectories.push(item);
			}
		}
	}

	console.log(`  📱 Found ${appDirectories.length} application directories:`, appDirectories);
	console.log(
		`  🎨 Found ${htmlFiles.length} HTML experiences:`,
		htmlFiles.map(f => f.replace(".html", ""))
	);

	if (appDirectories.length === 0 && htmlFiles.length === 0) {
		console.log("  ❌ No apps or experiences found!");
		allPassed = false;
	}
} catch (error) {
	console.log(`  ❌ Error checking apps: ${error.message}`);
	allPassed = false;
}

// Check compiled binary (Windows: main.exe, Linux: main)
console.log("\n⚙️  Checking compiled binary:");
const mainExists = existsSync("main") || existsSync("main.exe");
const binaryName = existsSync("main.exe") ? "main.exe" : "main";
console.log(`  ${mainExists ? "✅" : "❌"} ${binaryName} binary exists`);
if (!mainExists) allPassed = false;

if (mainExists) {
	try {
		const stats = statSync(binaryName);
		const sizeKB = Math.round(stats.size / 1024);
		console.log(`  📊 Binary size: ${sizeKB} KB`);

		if (sizeKB < 100) {
			console.log("  ⚠️  Binary seems unusually small");
		}
	} catch (error) {
		console.log(`  ⚠️  Could not get binary stats: ${error.message}`);
	}
}

console.log(`\n${"=".repeat(50)}`);
if (allPassed) {
	console.log("✅ Build verification PASSED! Ready for deployment.");
	process.exit(0);
} else {
	console.log("❌ Build verification FAILED! Deployment may not work correctly.");
	process.exit(1);
}
