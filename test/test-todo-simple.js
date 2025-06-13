import { chromium } from "playwright";

async function testSimpleTodo() {
	console.log("📝 Testing Simple Todo App...");

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
		await page.goto("http://localhost:3000/apps/todo-simple");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);

		const rootContent = await page.locator("#root").innerHTML();
		console.log(`📄 Root content length: ${rootContent.length}`);

		const buttons = await page.locator("button").count();
		console.log(`🔘 Found ${buttons} buttons`);

		const inputs = await page.locator("input").count();
		console.log(`📝 Found ${inputs} inputs`);

		if (rootContent.length > 0) {
			console.log("✅ Simple todo app loaded!");
		} else {
			console.log("❌ Simple todo app failed to load");
		}

		await page.screenshot({ path: "todo-simple-test.png" });
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	} finally {
		await page.waitForTimeout(3000);
		await browser.close();
	}
}

testSimpleTodo().catch(console.error);
