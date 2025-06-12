#!/usr/bin/env bun
import { build } from "bun";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";

console.log("\n🚀 Starting Gallery build process...\n");

const outdir = path.join(process.cwd(), "dist");

if (existsSync(outdir)) {
	console.log(`🗑️ Cleaning previous build at ${outdir}`);
	await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

// Scan for all HTML files in the project
const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
	.map(a => path.resolve("src", a))
	.filter(dir => !dir.includes("node_modules"));
console.log(
	`📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`
);

// Build all the HTML files
const result = await build({
	entrypoints,
	outdir,
	minify: true,
	target: "browser",
	sourcemap: "linked",
	define: {
		"process.env.NODE_ENV": JSON.stringify("production")
	}
});

// Print the results
const end = performance.now();

const outputTable = result.outputs.map(output => ({
	File: path.relative(process.cwd(), output.path),
	Type: output.kind,
	Size: ((bytes: number): string => {
		const units = ["B", "KB", "MB", "GB"];
		let size = bytes;
		let unitIndex = 0;
		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}
		return `${size.toFixed(2)} ${units[unitIndex]}`;
	})(output.size)
}));

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

console.log(`\n✅ Gallery build completed in ${buildTime}ms\n`);
