import { Html } from "@elysiajs/html";
import type { Children } from "@kitajs/html";
import { Meta } from "./Meta";
import type { ReactNode } from "react";
import "./index.css";

export const Base = ({
	title,
	children,
	version,
	ip
}: { title: string; children: Children; version: string; ip?: string }) => (
	<html lang="en">
		<head>
			<meta charSet="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>{title}</title>
			<link rel="icon" type="image/png" href="/icons/favicon-96x96.png" sizes="96x96" />
			<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
			<link rel="shortcut icon" href="/icons/favicon.ico" />
			<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
			<link rel="manifest" href="/site.webmanifest" />
			<Meta />
		</head>
		<body
			style={{
				margin: 0,
				display: "flex",
				height: "100vh",
				width: "100vw",
				backgroundColor: "#000000",
				color: "#ffffff",
				padding: 0
			}}
		>
			<div
				style={{
					margin: "auto",
					width: "100%",
					maxWidth: "320px",
					padding: "1rem",
					textAlign: "center"
				}}
			>
				{children as ReactNode}
				<p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#888888" }}>
					<a
						href="https://github.com/multisynq/synq-chat"
						target="_blank"
						rel="noreferrer noopener"
						style={{
							transition: "color 0.2s",
							color: "#888888",
							textDecoration: "none"
						}}
					>
						Synq Chat by tribixbite • {version}
					</a>
					<br />
					Your IP address is{" "}
					<code
						style={{
							borderRadius: "0.25rem",
							backgroundColor: "#000000",
							padding: "0.25rem"
						}}
					>
						{ip}
					</code>
				</p>
			</div>
		</body>
	</html>
);
