import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";

import { assertGetElementById } from "@shared/helpers/browser"; // Import the helper
import App from "./components/App.tsx";
import "./assets/index.css";

// Basic ErrorBoundary component
interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// You can log the error to an error reporting service here
		console.error("Uncaught error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: "20px", textAlign: "center" }}>
					<h1>Something went wrong.</h1>
					<p>{this.state.error?.toString()}</p>
					<button
						type="button"
						onClick={() => this.setState({ hasError: false, error: undefined })}
					>
						Try again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

const rootElement = assertGetElementById("root");

const vibesynqApp = (
	<StrictMode>
		<ErrorBoundary>
			<App />
			<ToastContainer className="pt-11 max-md:p-4" />
		</ErrorBoundary>
	</StrictMode>
);

createRoot(rootElement).render(vibesynqApp);
