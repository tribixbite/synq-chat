import { useState } from "react";
import { AdminFileManager } from "./AdminFileManager";
import { AppManager } from "./AppManager";

type AdminTab = "apps" | "files";

export function Admin() {
	const [password, setPassword] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [activeTab, setActiveTab] = useState<AdminTab>("apps");

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		// Simple authentication - replace with proper authentication in production
		if (password === "admin123") {
			setIsAuthenticated(true);
		} else {
			alert("Invalid password");
		}
	};

	if (!isAuthenticated) {
		return (
			<div
				style={{
					minHeight: "100vh",
					backgroundColor: "#0a0a0a",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
				}}
			>
				<div
					style={{
						maxWidth: "400px",
						width: "100%",
						padding: "40px",
						backgroundColor: "#1a1a1a",
						borderRadius: "16px",
						border: "1px solid rgba(255, 255, 255, 0.1)"
					}}
				>
					<div style={{ textAlign: "center", marginBottom: "32px" }}>
						<div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
						<h1
							style={{
								margin: "0 0 8px 0",
								fontSize: "24px",
								fontWeight: "700",
								background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent"
							}}
						>
							Admin Panel
						</h1>
						<p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
							Enter your password to continue
						</p>
					</div>
					<form onSubmit={handleLogin}>
						<div style={{ marginBottom: "20px" }}>
							<label
								htmlFor="password"
								style={{
									display: "block",
									marginBottom: "8px",
									fontSize: "14px",
									color: "#e5e7eb"
								}}
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								style={{
									width: "100%",
									padding: "12px",
									backgroundColor: "#0a0a0a",
									border: "1px solid rgba(255, 255, 255, 0.1)",
									borderRadius: "8px",
									color: "#ffffff",
									fontSize: "14px"
								}}
								required
							/>
						</div>
						<button
							type="submit"
							style={{
								width: "100%",
								padding: "12px",
								background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
								color: "white",
								border: "none",
								borderRadius: "8px",
								cursor: "pointer",
								fontWeight: "600",
								fontSize: "14px"
							}}
						>
							Login
						</button>
					</form>
				</div>
			</div>
		);
	}

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#0a0a0a",
				fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
			}}
		>
			{/* Navigation */}
			<nav
				style={{
					backgroundColor: "#1a1a1a",
					borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
					padding: "0 32px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center"
				}}
			>
				<div style={{ display: "flex", alignItems: "center" }}>
					<h1
						style={{
							margin: 0,
							fontSize: "18px",
							fontWeight: "600",
							color: "#ffffff",
							padding: "16px 0",
							marginRight: "32px"
						}}
					>
						🦊 Admin
					</h1>
					<div style={{ display: "flex", gap: "4px" }}>
						<button
							type="button"
							onClick={() => setActiveTab("apps")}
							style={{
								padding: "16px 20px",
								backgroundColor: "transparent",
								color: activeTab === "apps" ? "#8b5cf6" : "#9ca3af",
								border: "none",
								borderBottom:
									activeTab === "apps"
										? "2px solid #8b5cf6"
										: "2px solid transparent",
								cursor: "pointer",
								fontWeight: activeTab === "apps" ? "600" : "400",
								fontSize: "14px"
							}}
						>
							App Manager
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("files")}
							style={{
								padding: "16px 20px",
								backgroundColor: "transparent",
								color: activeTab === "files" ? "#8b5cf6" : "#9ca3af",
								border: "none",
								borderBottom:
									activeTab === "files"
										? "2px solid #8b5cf6"
										: "2px solid transparent",
								cursor: "pointer",
								fontWeight: activeTab === "files" ? "600" : "400",
								fontSize: "14px"
							}}
						>
							File Manager
						</button>
					</div>
				</div>
				<button
					type="button"
					onClick={() => setIsAuthenticated(false)}
					style={{
						padding: "8px 16px",
						backgroundColor: "rgba(239, 68, 68, 0.2)",
						color: "#fca5a5",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer",
						fontWeight: "500",
						fontSize: "13px"
					}}
				>
					Logout
				</button>
			</nav>

			{/* Content */}
			{activeTab === "apps" ? <AppManager /> : <AdminFileManager />}
		</div>
	);
}
