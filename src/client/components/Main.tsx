import bunSvg from "@client/assets/bun.svg";
import { useAppContext } from "@client/hooks/useAppContext";

import { useState } from "react";
import { Admin } from "./Admin";

export const Main = () => {
	const { count, setCount } = useAppContext();
	const [currentView, setCurrentView] = useState<"home" | "admin">("home");

	const renderHome = () => (
		<div className="flex-center-col">
			<h1>hello from bun!</h1>
			<img src={bunSvg} width={250} height={250} alt="hello from bun!" />
			<p>Hot-reloads with persisted state on file save.</p>
			<button type="button" onClick={() => setCount(c => c + 1)}>
				Count: {count}
			</button>
			<button type="button" className="link-btn" onClick={() => setCount(0)}>
				Reset Count
			</button>
		</div>
	);

	return (
		<div>
			<nav
				style={{
					padding: "10px",
					backgroundColor: "#f8f9fa",
					marginBottom: "20px",
					display: "flex",
					gap: "15px"
				}}
			>
				<button
					type="button"
					onClick={() => setCurrentView("home")}
					style={{
						padding: "8px 16px",
						backgroundColor: currentView === "home" ? "#2196f3" : "transparent",
						color: currentView === "home" ? "white" : "black",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer"
					}}
				>
					Home
				</button>
				<button
					type="button"
					onClick={() => setCurrentView("admin")}
					style={{
						padding: "8px 16px",
						backgroundColor: currentView === "admin" ? "#2196f3" : "transparent",
						color: currentView === "admin" ? "white" : "black",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer"
					}}
				>
					Admin
				</button>
			</nav>

			{currentView === "home" && renderHome()}
			{currentView === "admin" && <Admin />}
		</div>
	);
};
