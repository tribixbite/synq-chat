import { chromium } from "playwright";

async function testTodo() {
	console.log("📝 Testing Todo List App...");

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
		await page.goto("http://localhost:3000/apps/todo-list");
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(2000);

		const rootContent = await page.locator("#root").innerHTML();
		console.log(`📄 Root content length: ${rootContent.length}`);

		const buttons = await page.locator("button").count();
		console.log(`🔘 Found ${buttons} buttons`);

		const inputs = await page.locator("input").count();
		console.log(`📝 Found ${inputs} inputs`);

		if (rootContent.length > 0) {
			console.log("✅ Todo app content loaded!");

			// Try to add a todo
			if (inputs > 0) {
				await page.fill('input[type="text"]', "Test todo item");
				await page.click('button:has-text("Add")');
				console.log("✅ Added a todo item");

				// Check if it was added
				const todoItems = await page.locator("li").count();
				console.log(`📋 Found ${todoItems} todo items`);
			}
		} else {
			console.log("❌ Todo app failed to load content");
		}

		await page.screenshot({ path: "todo-test.png" });
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	} finally {
		await page.waitForTimeout(3000);
		await browser.close();
	}
}

testTodo().catch(console.error);
