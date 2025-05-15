import type React from "react";

interface FooterProps {
	appName: string;
}

export const Footer: React.FC<FooterProps> = ({ appName }) => {
	return (
		<footer
			style={{
				borderTop: "1px solid #ccc",
				marginTop: "2rem",
				padding: "1rem 0",
				textAlign: "center",
				fontSize: "0.875rem",
				color: "#555"
			}}
		>
			<p>
				&copy; {new Date().getFullYear()} {appName} - Monorepo Project
			</p>
			<nav>
				<a href="/vibesynq/" style={{ marginRight: "1rem" }}>
					Vibesynq
				</a>
				<a href="/admin/">Admin</a>
			</nav>
		</footer>
	);
};
