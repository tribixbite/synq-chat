import { chromium } from "playwright";

async function testSimple() {
	console.log("🧪 Testing Simple Component...");

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
		await page.goto("http://localhost:3000/apps/simple-test");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);

		const rootContent = await page.locator("#root").innerHTML();
		console.log(`📄 Root content length: ${rootContent.length}`);

		const buttons = await page.locator("button").count();
		console.log(`🔘 Found ${buttons} buttons`);

		if (buttons > 0) {
			console.log("✅ Simple component working!");
			await page.click("button");
			console.log("✅ Button clicked successfully!");
		}

		await page.screenshot({ path: "simple-test.png" });
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	} finally {
		await page.waitForTimeout(3000);
		await browser.close();
	}
}

testSimple().catch(console.error);
