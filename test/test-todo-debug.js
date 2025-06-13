import { chromium } from "playwright";

async function testTodoDebug() {
	console.log("🐛 Testing Todo Debug App...");

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();

	page.on("console", msg => {
		console.log(`🌐 Browser Console [${msg.type()}]:`, msg.text());
	});

	page.on("pageerror", error => {
		console.error("🚨 Page Error:", error.message);
	});

	try {
		await page.goto("http://localhost:3000/apps/todo-debug");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);

		const rootContent = await page.locator("#root").innerHTML();
		console.log(`📄 Root content length: ${rootContent.length}`);

		if (rootContent.length > 0) {
			console.log("✅ Todo debug app loaded!");
		} else {
			console.log("❌ Todo debug app failed to load");
		}
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	} finally {
		await page.waitForTimeout(2000);
		await browser.close();
	}
}

testTodoDebug().catch(console.error);
