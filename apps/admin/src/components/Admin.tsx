import { useState } from "react";
import { AdminFileManager } from "./AdminFileManager";

export function Admin() {
	const [password, setPassword] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);

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
			<div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
				<h1>Admin Login</h1>
				<form onSubmit={handleLogin}>
					<div style={{ marginBottom: "15px" }}>
						<label htmlFor="password" style={{ display: "block", marginBottom: "5px" }}>
							Password:
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							style={{
								width: "100%",
								padding: "8px",
								border: "1px solid #ddd",
								borderRadius: "4px"
							}}
							required
						/>
					</div>
					<button
						type="submit"
						style={{
							padding: "10px",
							backgroundColor: "#2196f3",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						Login
					</button>
				</form>
			</div>
		);
	}

	return (
		<div>
			<div
				style={{
					padding: "10px",
					backgroundColor: "#f0f0f0",
					marginBottom: "20px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center"
				}}
			>
				<h1 style={{ margin: 0 }}>Admin Panel</h1>
				<button
					type="button"
					onClick={() => setIsAuthenticated(false)}
					style={{
						padding: "8px 12px",
						backgroundColor: "#f44336",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer"
					}}
				>
					Logout
				</button>
			</div>
			<AdminFileManager />
		</div>
	);
}
