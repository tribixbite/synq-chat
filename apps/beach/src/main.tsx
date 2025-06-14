import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ReactTogether } from "react-together";

// Verify API Keys - REMOVE THIS LOGGING IN PRODUCTION
console.log("VITE_RT_APP_ID:", import.meta.env.VITE_RT_APP_ID);
// Ensure this variable is prefixed with VITE_ in your .env file
console.log("VITE_MULTISYNQ_API_KEY:", import.meta.env.VITE_MULTISYNQ_API_KEY);

const rootElement = document.getElementById("root");
const sessionParams = {
	appId: (import.meta.env.VITE_RT_APP_ID as string) || "beachtest1.local.thing",
	apiKey: (import.meta.env.VITE_MULTISYNQ_API_KEY as string) || "apikeygoeshere", // Use VITE_ prefixed env variable
	name: "vibe-beach-default-lobby", // Auto-join this default session
	// You could add a password here if you want the default lobby to be private:
	password: "lobbypassword"
};
if (rootElement) {
	createRoot(rootElement).render(
		<StrictMode>
			<ReactTogether
				sessionParams={sessionParams}
				// rememberUsers={true}
			>
				<App />
			</ReactTogether>
		</StrictMode>
	);
} else {
	throw new Error("Root element with id 'root' not found.");
}
