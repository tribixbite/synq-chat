import { vibesynqAiPlugin } from "../src/server/plugins/vibesynqAiPlugin";

// Test 1: Valid request with test provider
console.log("🧪 Test 1: Valid request with test provider");
const testRequest1 = new Request("http://localhost:3000/api/vibesynq-ai", {
	mode: "cors",
	method: "POST",
	body: JSON.stringify({
		prompt: "Hello, how are you?",
		html: "",
		previousPrompt: "",
		provider: "test",
		localSettings: {}
	}),
	headers: {
		"Content-Type": "application/json"
	}
});

const response1 = await vibesynqAiPlugin.handle(testRequest1);
console.log(`✅ Test 1 passed: ${response1.ok}`);

// Test 2: Missing prompt (should return 422 - validation error)
console.log("\n🧪 Test 2: Missing prompt (should return 422)");
const testRequest2 = new Request("http://localhost:3000/api/vibesynq-ai", {
	mode: "cors",
	method: "POST",
	body: JSON.stringify({
		provider: "test",
		localSettings: {}
	}),
	headers: {
		"Content-Type": "application/json"
	}
});

const response2 = await vibesynqAiPlugin.handle(testRequest2);
console.log(`✅ Test 2 passed: ${response2.status === 422}`);

// Test 3: OpenAI provider without API key (should fallback)
console.log("\n🧪 Test 3: OpenAI without API key (should fallback to working provider)");
const testRequest3 = new Request("http://localhost:3000/api/vibesynq-ai", {
	mode: "cors",
	method: "POST",
	body: JSON.stringify({
		prompt: "Create a simple button",
		provider: "openai",
		localSettings: {
			openaiApiKey: "",
			openaiModel: "gpt-3.5-turbo"
		}
	}),
	headers: {
		"Content-Type": "application/json"
	}
});

const response3 = await vibesynqAiPlugin.handle(testRequest3);
console.log(`✅ Test 3 passed: ${response3.ok}`);

// Final result
const allTestsPassed = response1.ok && response2.status === 422 && response3.ok;
console.log(`\n🎯 All tests passed: ${allTestsPassed}`);
console.log(allTestsPassed);
