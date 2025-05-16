import "./main.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { assertGetElementById, registerServiceWorker } from "@shared/helpers/browser";
import { AppContextProvider } from "./components/AppContextProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Main } from "./components/Main";

const rootElement = assertGetElementById("root");

const app = (
	<StrictMode>
		<ErrorBoundary>
			<QueryClientProvider client={new QueryClient()}>
				<AppContextProvider>
					<Main />
				</AppContextProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	</StrictMode>
);

createRoot(rootElement).render(app);

registerServiceWorker().catch(console.error);
