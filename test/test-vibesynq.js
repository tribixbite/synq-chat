import { chromium } from "playwright";

async function testVibesynq() {
	console.log("🎵 Testing VibeSynq App...");

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();

	page.on("console", msg => {
		console.log(`🌐 Browser Console [${msg.type()}]:`, msg.text());
	});

	page.on("pageerror", error => {
		console.error("🚨 Page Error:", error.message);
	});

	const failedRequests = [];
	page.on("response", response => {
		if (!response.ok()) {
			failedRequests.push(`${response.status()} ${response.url()}`);
			console.log(`❌ Failed request: ${response.status()} ${response.url()}`);
		}
	});

	try {
		await page.goto("http://localhost:3000/apps/vibesynq");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(3000);

		const rootContent = await page.locator("#root").innerHTML();
		console.log(`📄 Root content length: ${rootContent.length}`);

		// Check if CSS is loaded by looking for styled elements
		const hasStyles = await page.evaluate(() => {
			const element = document.querySelector("body");
			const styles = window.getComputedStyle(element);
			return styles.margin !== "" || styles.padding !== "" || styles.backgroundColor !== "";
		});

		console.log(`🎨 CSS loaded: ${hasStyles ? "Yes" : "No"}`);

		if (rootContent.length > 0) {
			console.log("✅ VibeSynq app content loaded!");
		} else {
			console.log("❌ VibeSynq app failed to load content");
		}

		await page.screenshot({ path: "vibesynq-test.png" });

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

testVibesynq().catch(console.error);
