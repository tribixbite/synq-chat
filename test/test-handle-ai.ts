import { vibesynqAiPlugin } from "../src/server/plugins/vibesynqAiPlugin";

const testRequest = new Request("http://localhost:3000/api/vibesynq-ai", {
	mode: "cors",
	method: "POST",
	body: JSON.stringify({
		prompt: "Hello, how are you?",
		html: "",
		previousPrompt: "",
		provider: "openai",
		ApiKey: "",
		ApiUrl: "",
		Model: ""
	}),
	headers: {
		"Content-Type": "application/json"
	}
});

const response = await vibesynqAiPlugin.handle(testRequest);

console.log(response.ok);
