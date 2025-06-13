import { chromium } from "playwright";

async function testCalculator() {
	console.log("🧮 Testing Calculator App...");

	// Launch browser
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();

	// Capture console logs
	page.on("console", msg => {
		console.log(`🌐 Browser Console [${msg.type()}]:`, msg.text());
	});

	// Capture page errors
	page.on("pageerror", error => {
		console.error("🚨 Page Error:", error.message);
	});

	try {
		// Navigate to calculator
		console.log("📍 Navigating to http://localhost:3000/apps/calculator");
		await page.goto("http://localhost:3000/apps/calculator");

		// Wait for the page to load
		console.log("⏳ Waiting for page to load...");
		await page.waitForLoadState("networkidle");

		// Wait a bit more for React to render
		await page.waitForTimeout(2000);

		// Check if root element exists and has content
		const rootExists = await page.locator("#root").count();
		console.log(`📍 Root element count: ${rootExists}`);

		const rootContent = await page.locator("#root").innerHTML();
		console.log(`📄 Root content length: ${rootContent.length}`);

		if (rootContent.length > 0) {
			console.log("✅ Root has content, React component mounted!");

			// Check for specific calculator elements
			const buttons = await page.locator("button").count();
			console.log(`🔘 Found ${buttons} buttons`);

			const inputs = await page.locator("input").count();
			console.log(`📝 Found ${inputs} inputs`);

			// Check if we can see the calculator title
			const title = await page.textContent("h1");
			console.log(`📋 Title: ${title}`);

			if (buttons > 0 && inputs > 0) {
				console.log("🎉 Calculator UI is fully rendered!");

				// Test basic functionality
				console.log("🔢 Testing basic calculations...");

				// Clear first
				await page.click('button:has-text("Clear")');
				console.log("✅ Clear button clicked");

				// Test: 2 + 3 = 5
				await page.click('button:has-text("2")');
				await page.click('button:has-text("+")');
				await page.click('button:has-text("3")');
				await page.click('button:has-text("=")');

				// Check result
				const result = await page.inputValue('input[type="text"]');
				console.log(`🧮 2 + 3 = ${result} (expected: 5)`);

				if (result === "5") {
					console.log("✅ Addition test passed!");
				} else {
					console.log("❌ Addition test failed!");
				}

				// Test multiplication
				await page.click('button:has-text("Clear")');
				await page.click('button:has-text("7")');
				await page.click('button:has-text("×")');
				await page.click('button:has-text("8")');
				await page.click('button:has-text("=")');

				const result2 = await page.inputValue('input[type="text"]');
				console.log(`🧮 7 × 8 = ${result2} (expected: 56)`);

				if (result2 === "56") {
					console.log("✅ Multiplication test passed!");
				} else {
					console.log("❌ Multiplication test failed!");
				}

				// Test decimal
				await page.click('button:has-text("Clear")');
				await page.click('button:has-text("3")');
				await page.click('button:has-text(".")');
				await page.click('button:has-text("1")');
				await page.click('button:has-text("4")');

				const result3 = await page.inputValue('input[type="text"]');
				console.log(`🧮 Decimal input: ${result3} (expected: 3.14)`);

				if (result3 === "3.14") {
					console.log("✅ Decimal test passed!");
				} else {
					console.log("❌ Decimal test failed!");
				}

				console.log("🎉 Calculator testing completed successfully!");
			} else {
				console.log("⚠️ Calculator UI not fully rendered");
			}

			// Take a screenshot to see what's rendered
			await page.screenshot({ path: "calculator-final.png", fullPage: true });
			console.log("📸 Final screenshot saved as calculator-final.png");
		} else {
			console.log("❌ Root element is empty - React component failed to mount");
		}
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	} finally {
		// Keep browser open for 5 seconds to see the result
		console.log("🔍 Keeping browser open for inspection...");
		await page.waitForTimeout(5000);
		await browser.close();
	}
}

// Run the test
testCalculator().catch(console.error);
