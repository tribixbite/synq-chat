import { chromium } from "playwright";

async function testBeach() {
	console.log("🏖️ Testing Beach App...");

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
		await page.goto("http://localhost:3000/apps/beach");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(3000);

		const rootContent = await page.locator("#root").innerHTML();
		console.log(`📄 Root content length: ${rootContent.length}`);

		if (rootContent.length > 0) {
			console.log("✅ Beach app content loaded!");
		} else {
			console.log("❌ Beach app failed to load content");
		}

		// Check for any failed network requests
		const failedRequests = [];
		page.on("response", response => {
			if (!response.ok()) {
				failedRequests.push(`${response.status()} ${response.url()}`);
			}
		});

		await page.screenshot({ path: "beach-test.png" });

		if (failedRequests.length > 0) {
			console.log("❌ Failed requests:", failedRequests);
		} else {
			console.log("✅ All requests successful");
		}
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	} finally {
		await page.waitForTimeout(3000);
		await browser.close();
	}
}

testBeach().catch(console.error);
