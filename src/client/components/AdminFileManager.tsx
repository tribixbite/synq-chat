import type React from "react";
import { useEffect, useState } from "react";

interface FileEntry {
	name: string;
	isDirectory: boolean;
	path: string;
}

interface ApiResponse {
	files?: FileEntry[];
	currentDir?: string;
	error?: string;
	success?: boolean;
	path?: string;
}

export function AdminFileManager() {
	// State
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [currentDir, setCurrentDir] = useState("");
	const [newFileName, setNewFileName] = useState("");
	const [fileContent, setFileContent] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	// Fetch files from the server
	const fetchFiles = async (dir = "") => {
		setLoading(true);
		setError("");

		try {
			const response = await fetch(`/api/admin/files?dir=${encodeURIComponent(dir)}`);
			const data: ApiResponse = await response.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			if (data.files) {
				setFiles(data.files);
				setCurrentDir(data.currentDir || "");
			}
		} catch (err) {
			setError(`Failed to fetch files: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setLoading(false);
		}
	};

	// Handle file upload
	const handleUpload = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			if (!newFileName.trim()) {
				setError("File name is required");
				setLoading(false);
				return;
			}

			const response = await fetch(
				`/api/admin/upload?dir=${encodeURIComponent(currentDir)}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						file: newFileName,
						content: fileContent
					})
				}
			);

			const data: ApiResponse = await response.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			if (data.success) {
				setSuccess(`File ${data.path} uploaded successfully`);
				setNewFileName("");
				setFileContent("");
				fetchFiles(currentDir);
			}
		} catch (err) {
			setError(`Failed to upload file: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setLoading(false);
		}
	};

	// Navigate to a directory
	const navigateToDirectory = (path: string) => {
		fetchFiles(path);
	};

	// Go up to parent directory
	const goToParentDirectory = () => {
		if (!currentDir) return;

		const parts = currentDir.split("/").filter(Boolean);
		parts.pop();
		const parentDir = parts.join("/");
		fetchFiles(parentDir);
	};

	// Fetch files on component mount
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const initialFetch = async () => {
			await fetchFiles();
		};
		initialFetch();
		// This is a component mount effect that only needs to run once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div
			style={{
				maxWidth: "800px",
				margin: "0 auto",
				padding: "20px",
				fontFamily: "system-ui, sans-serif"
			}}
		>
			<h1>Admin File Manager</h1>

			{error && (
				<div
					style={{
						backgroundColor: "#ffebee",
						color: "#c62828",
						padding: "10px",
						marginBottom: "20px",
						borderRadius: "4px"
					}}
				>
					{error}
				</div>
			)}

			{success && (
				<div
					style={{
						backgroundColor: "#e8f5e9",
						color: "#2e7d32",
						padding: "10px",
						marginBottom: "20px",
						borderRadius: "4px"
					}}
				>
					{success}
				</div>
			)}

			<div
				style={{
					marginBottom: "20px",
					padding: "10px",
					backgroundColor: "#f5f5f5",
					borderRadius: "4px"
				}}
			>
				<strong>Current Directory:</strong> {currentDir || "/"}{" "}
				{currentDir && (
					<button
						type="button"
						onClick={goToParentDirectory}
						disabled={loading}
						style={{
							padding: "5px 10px",
							backgroundColor: "#2196f3",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer"
						}}
					>
						Go Up
					</button>
				)}
			</div>

			<div style={{ marginBottom: "30px" }}>
				<h2>Files</h2>
				{loading ? (
					<div>Loading...</div>
				) : (
					<ul style={{ listStyle: "none", padding: 0 }}>
						{files.length === 0 && <li>No files in this directory</li>}
						{files.map((file: FileEntry) => (
							<li
								key={file.path}
								style={{
									padding: "8px",
									borderBottom: "1px solid #eee"
								}}
							>
								{file.isDirectory ? (
									<button
										type="button"
										onClick={() => navigateToDirectory(file.path)}
										disabled={loading}
										style={{
											background: "none",
											border: "none",
											cursor: "pointer",
											color: "#2196f3",
											fontWeight: "bold",
											display: "inline-block",
											textAlign: "left",
											width: "100%"
										}}
									>
										📁 {file.name}
									</button>
								) : (
									<span>📄 {file.name}</span>
								)}
							</li>
						))}
					</ul>
				)}
			</div>

			<div>
				<h2>Upload File</h2>
				<form
					onSubmit={handleUpload}
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "15px"
					}}
				>
					<div>
						<label
							htmlFor="fileName"
							style={{
								display: "block",
								marginBottom: "5px"
							}}
						>
							File Name:
						</label>
						<input
							type="text"
							id="fileName"
							value={newFileName}
							onChange={e => setNewFileName(e.target.value)}
							required
							disabled={loading}
							style={{
								width: "100%",
								padding: "8px",
								border: "1px solid #ddd",
								borderRadius: "4px"
							}}
						/>
					</div>

					<div>
						<label
							htmlFor="fileContent"
							style={{
								display: "block",
								marginBottom: "5px"
							}}
						>
							Content:
						</label>
						<textarea
							id="fileContent"
							value={fileContent}
							onChange={e => setFileContent(e.target.value)}
							rows={10}
							disabled={loading}
							style={{
								width: "100%",
								padding: "8px",
								border: "1px solid #ddd",
								borderRadius: "4px"
							}}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						style={{
							padding: "10px",
							backgroundColor: "#2196f3",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							...(loading ? { backgroundColor: "#bdbdbd" } : {})
						}}
					>
						{loading ? "Uploading..." : "Upload File"}
					</button>
				</form>
			</div>
		</div>
	);
}
