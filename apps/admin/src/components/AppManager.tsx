import type React from "react";
import { useEffect, useState, useRef, useCallback } from "react";

interface AppEntry {
	name: string;
	type: "tsx" | "html";
	path: string;
	url: string;
	size: number;
	modifiedAt: string;
	metadata?: {
		description?: string;
		author?: string;
	};
}

interface UploadResponse {
	success?: boolean;
	error?: string;
	appName?: string;
	url?: string;
	message?: string;
}

export function AppManager() {
	const [apps, setApps] = useState<AppEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const [showUploadForm, setShowUploadForm] = useState(false);
	const [editingApp, setEditingApp] = useState<AppEntry | null>(null);
	const [formData, setFormData] = useState({
		filename: "",
		content: "",
		description: "",
		author: ""
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Fetch all apps
	const fetchApps = useCallback(async () => {
		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/admin/apps");
			const data = await response.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			setApps(data.apps || []);
		} catch (err) {
			setError(`Failed to fetch apps: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setLoading(false);
		}
	}, []);

	// Upload app
	const uploadApp = async (
		filename: string,
		content: string,
		description?: string,
		author?: string
	) => {
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch("/api/admin/upload-app", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filename, content, description, author })
			});

			const data: UploadResponse = await response.json();

			if (data.error) {
				setError(data.error);
				return false;
			}

			if (data.success) {
				setSuccess(data.message || "App uploaded successfully!");
				await fetchApps();
				return true;
			}
		} catch (err) {
			setError(`Failed to upload app: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setLoading(false);
		}

		return false;
	};

	// Delete app
	const deleteApp = async (name: string) => {
		if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch(`/api/admin/apps/${name}`, {
				method: "DELETE"
			});

			const data = await response.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			setSuccess(`App "${name}" deleted successfully`);
			await fetchApps();
		} catch (err) {
			setError(`Failed to delete app: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setLoading(false);
		}
	};

	// Update app
	const updateApp = async (
		name: string,
		content: string,
		description?: string,
		author?: string
	) => {
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch(`/api/admin/apps/${name}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content, description, author })
			});

			const data = await response.json();

			if (data.error) {
				setError(data.error);
				return false;
			}

			setSuccess(`App "${name}" updated successfully`);
			await fetchApps();
			return true;
		} catch (err) {
			setError(`Failed to update app: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setLoading(false);
		}

		return false;
	};

	// Load app content for editing
	const loadAppForEditing = async (app: AppEntry) => {
		try {
			const response = await fetch(`/api/admin/apps/${app.name}`);
			const data = await response.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			setEditingApp(app);
			setFormData({
				filename: `${app.name}.${app.type}`,
				content: data.content,
				description: data.metadata?.description || "",
				author: data.metadata?.author || ""
			});
			setShowUploadForm(true);
		} catch (err) {
			setError(`Failed to load app: ${err instanceof Error ? err.message : String(err)}`);
		}
	};

	// Handle form submit
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.filename.trim() || !formData.content.trim()) {
			setError("Filename and content are required");
			return;
		}

		let success: boolean;
		if (editingApp) {
			success = await updateApp(
				editingApp.name,
				formData.content,
				formData.description,
				formData.author
			);
		} else {
			success = await uploadApp(
				formData.filename,
				formData.content,
				formData.description,
				formData.author
			);
		}

		if (success) {
			resetForm();
		}
	};

	// Reset form
	const resetForm = () => {
		setFormData({ filename: "", content: "", description: "", author: "" });
		setEditingApp(null);
		setShowUploadForm(false);
	};

	// Handle drag and drop
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const files = Array.from(e.dataTransfer.files);
		for (const file of files) {
			const ext = file.name.split(".").pop()?.toLowerCase();
			if (ext === "tsx" || ext === "html" || ext === "htm") {
				const content = await file.text();
				await uploadApp(file.name, content);
			} else {
				setError(
					`Invalid file type: ${file.name}. Only .tsx and .html files are supported.`
				);
			}
		}
	};

	// Handle file input change
	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		for (const file of Array.from(files)) {
			const content = await file.text();
			setFormData({
				...formData,
				filename: file.name,
				content
			});
			setShowUploadForm(true);
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Format file size
	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	// Format date
	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	useEffect(() => {
		fetchApps();
	}, [fetchApps]);

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#0a0a0a",
				color: "#ffffff",
				fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
			}}
		>
			{/* Header */}
			<div
				style={{
					background:
						"linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))",
					borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
					padding: "24px 32px"
				}}
			>
				<div style={{ maxWidth: "1200px", margin: "0 auto" }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						}}
					>
						<div>
							<h1
								style={{
									fontSize: "28px",
									fontWeight: "700",
									margin: "0 0 4px 0",
									background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent"
								}}
							>
								App Manager
							</h1>
							<p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
								Upload, manage, and deploy TSX & HTML apps instantly
							</p>
						</div>
						<div style={{ display: "flex", gap: "12px" }}>
							<button
								type="button"
								onClick={() => {
									setShowUploadForm(true);
									setEditingApp(null);
								}}
								style={{
									padding: "10px 20px",
									background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
									color: "white",
									border: "none",
									borderRadius: "8px",
									cursor: "pointer",
									fontWeight: "600",
									fontSize: "14px",
									display: "flex",
									alignItems: "center",
									gap: "8px"
								}}
							>
								<span style={{ fontSize: "18px" }}>+</span> New App
							</button>
							<a
								href="/apps"
								target="_blank"
								rel="noopener noreferrer"
								style={{
									padding: "10px 20px",
									background: "rgba(255, 255, 255, 0.1)",
									color: "white",
									border: "1px solid rgba(255, 255, 255, 0.2)",
									borderRadius: "8px",
									cursor: "pointer",
									fontWeight: "500",
									fontSize: "14px",
									textDecoration: "none"
								}}
							>
								View Gallery
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px" }}>
				{/* Alerts */}
				{error && (
					<div
						style={{
							backgroundColor: "rgba(239, 68, 68, 0.1)",
							border: "1px solid rgba(239, 68, 68, 0.3)",
							color: "#fca5a5",
							padding: "12px 16px",
							marginBottom: "24px",
							borderRadius: "8px",
							fontSize: "14px"
						}}
					>
						{error}
					</div>
				)}

				{success && (
					<div
						style={{
							backgroundColor: "rgba(34, 197, 94, 0.1)",
							border: "1px solid rgba(34, 197, 94, 0.3)",
							color: "#86efac",
							padding: "12px 16px",
							marginBottom: "24px",
							borderRadius: "8px",
							fontSize: "14px"
						}}
					>
						{success}
					</div>
				)}

				{/* Drop Zone */}
				<button
					type="button"
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
					style={{
						width: "100%",
						border: `2px dashed ${isDragging ? "#8b5cf6" : "rgba(255, 255, 255, 0.2)"}`,
						borderRadius: "12px",
						padding: "48px",
						textAlign: "center",
						marginBottom: "32px",
						cursor: "pointer",
						backgroundColor: isDragging
							? "rgba(139, 92, 246, 0.1)"
							: "rgba(255, 255, 255, 0.02)",
						transition: "all 0.2s ease"
					}}
				>
					<div style={{ fontSize: "48px", marginBottom: "16px" }}>
						{isDragging ? "📥" : "📤"}
					</div>
					<p style={{ color: "#e5e7eb", fontSize: "16px", margin: "0 0 8px 0" }}>
						{isDragging ? "Drop files here..." : "Drag & drop TSX or HTML files here"}
					</p>
					<p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
						or click to browse
					</p>
					<input
						ref={fileInputRef}
						type="file"
						accept=".tsx,.html,.htm"
						multiple
						onChange={handleFileSelect}
						style={{ display: "none" }}
					/>
				</button>

				{/* Upload/Edit Form Modal */}
				{showUploadForm && (
					<div
						style={{
							position: "fixed",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: "rgba(0, 0, 0, 0.8)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 1000,
							padding: "20px"
						}}
					>
						<div
							style={{
								backgroundColor: "#1a1a1a",
								borderRadius: "16px",
								padding: "32px",
								width: "100%",
								maxWidth: "800px",
								maxHeight: "90vh",
								overflow: "auto",
								border: "1px solid rgba(255, 255, 255, 0.1)"
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "24px"
								}}
							>
								<h2 style={{ margin: 0, fontSize: "20px" }}>
									{editingApp ? `Edit ${editingApp.name}` : "Create New App"}
								</h2>
								<button
									type="button"
									onClick={resetForm}
									style={{
										background: "none",
										border: "none",
										color: "#9ca3af",
										fontSize: "24px",
										cursor: "pointer",
										padding: "4px"
									}}
								>
									×
								</button>
							</div>

							<form onSubmit={handleSubmit}>
								<div style={{ marginBottom: "20px" }}>
									<label
										htmlFor="app-filename"
										style={{
											display: "block",
											marginBottom: "8px",
											fontSize: "14px",
											color: "#e5e7eb"
										}}
									>
										Filename
									</label>
									<input
										id="app-filename"
										type="text"
										value={formData.filename}
										onChange={e =>
											setFormData({ ...formData, filename: e.target.value })
										}
										placeholder="my-app.tsx"
										disabled={!!editingApp}
										style={{
											width: "100%",
											padding: "12px",
											backgroundColor: editingApp ? "#2a2a2a" : "#0a0a0a",
											border: "1px solid rgba(255, 255, 255, 0.1)",
											borderRadius: "8px",
											color: editingApp ? "#6b7280" : "#ffffff",
											fontSize: "14px"
										}}
									/>
								</div>

								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: "16px",
										marginBottom: "20px"
									}}
								>
									<div>
										<label
											htmlFor="app-description"
											style={{
												display: "block",
												marginBottom: "8px",
												fontSize: "14px",
												color: "#e5e7eb"
											}}
										>
											Description (optional)
										</label>
										<input
											id="app-description"
											type="text"
											value={formData.description}
											onChange={e =>
												setFormData({
													...formData,
													description: e.target.value
												})
											}
											placeholder="A cool React app"
											style={{
												width: "100%",
												padding: "12px",
												backgroundColor: "#0a0a0a",
												border: "1px solid rgba(255, 255, 255, 0.1)",
												borderRadius: "8px",
												color: "#ffffff",
												fontSize: "14px"
											}}
										/>
									</div>
									<div>
										<label
											htmlFor="app-author"
											style={{
												display: "block",
												marginBottom: "8px",
												fontSize: "14px",
												color: "#e5e7eb"
											}}
										>
											Author (optional)
										</label>
										<input
											id="app-author"
											type="text"
											value={formData.author}
											onChange={e =>
												setFormData({ ...formData, author: e.target.value })
											}
											placeholder="Your name"
											style={{
												width: "100%",
												padding: "12px",
												backgroundColor: "#0a0a0a",
												border: "1px solid rgba(255, 255, 255, 0.1)",
												borderRadius: "8px",
												color: "#ffffff",
												fontSize: "14px"
											}}
										/>
									</div>
								</div>

								<div style={{ marginBottom: "24px" }}>
									<label
										htmlFor="app-code"
										style={{
											display: "block",
											marginBottom: "8px",
											fontSize: "14px",
											color: "#e5e7eb"
										}}
									>
										Code
									</label>
									<textarea
										id="app-code"
										value={formData.content}
										onChange={e =>
											setFormData({ ...formData, content: e.target.value })
										}
										placeholder="Paste your TSX or HTML code here..."
										rows={15}
										style={{
											width: "100%",
											padding: "12px",
											backgroundColor: "#0a0a0a",
											border: "1px solid rgba(255, 255, 255, 0.1)",
											borderRadius: "8px",
											color: "#ffffff",
											fontSize: "13px",
											fontFamily: "'Fira Code', 'Monaco', monospace",
											resize: "vertical"
										}}
									/>
								</div>

								<div
									style={{
										display: "flex",
										gap: "12px",
										justifyContent: "flex-end"
									}}
								>
									<button
										type="button"
										onClick={resetForm}
										style={{
											padding: "12px 24px",
											backgroundColor: "rgba(255, 255, 255, 0.1)",
											color: "#ffffff",
											border: "none",
											borderRadius: "8px",
											cursor: "pointer",
											fontWeight: "500"
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={loading}
										style={{
											padding: "12px 24px",
											background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
											color: "white",
											border: "none",
											borderRadius: "8px",
											cursor: loading ? "not-allowed" : "pointer",
											fontWeight: "600",
											opacity: loading ? 0.7 : 1
										}}
									>
										{loading
											? "Saving..."
											: editingApp
												? "Update App"
												: "Create App"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Stats */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
						gap: "16px",
						marginBottom: "32px"
					}}
				>
					<div
						style={{
							backgroundColor: "rgba(250, 204, 21, 0.1)",
							border: "1px solid rgba(250, 204, 21, 0.2)",
							borderRadius: "12px",
							padding: "20px",
							textAlign: "center"
						}}
					>
						<div style={{ fontSize: "32px", fontWeight: "700", color: "#facc15" }}>
							{apps.filter(a => a.type === "tsx").length}
						</div>
						<div style={{ fontSize: "14px", color: "#9ca3af" }}>TSX Apps</div>
					</div>
					<div
						style={{
							backgroundColor: "rgba(6, 182, 212, 0.1)",
							border: "1px solid rgba(6, 182, 212, 0.2)",
							borderRadius: "12px",
							padding: "20px",
							textAlign: "center"
						}}
					>
						<div style={{ fontSize: "32px", fontWeight: "700", color: "#06b6d4" }}>
							{apps.filter(a => a.type === "html").length}
						</div>
						<div style={{ fontSize: "14px", color: "#9ca3af" }}>HTML Apps</div>
					</div>
					<div
						style={{
							backgroundColor: "rgba(139, 92, 246, 0.1)",
							border: "1px solid rgba(139, 92, 246, 0.2)",
							borderRadius: "12px",
							padding: "20px",
							textAlign: "center"
						}}
					>
						<div style={{ fontSize: "32px", fontWeight: "700", color: "#8b5cf6" }}>
							{apps.length}
						</div>
						<div style={{ fontSize: "14px", color: "#9ca3af" }}>Total Apps</div>
					</div>
				</div>

				{/* Apps Grid */}
				<h2
					style={{
						fontSize: "20px",
						fontWeight: "600",
						marginBottom: "20px",
						color: "#e5e7eb"
					}}
				>
					Your Apps
				</h2>

				{loading && apps.length === 0 ? (
					<div style={{ textAlign: "center", padding: "48px", color: "#6b7280" }}>
						Loading apps...
					</div>
				) : apps.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: "48px",
							backgroundColor: "rgba(255, 255, 255, 0.02)",
							borderRadius: "12px",
							border: "1px solid rgba(255, 255, 255, 0.05)"
						}}
					>
						<div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
						<p style={{ color: "#9ca3af", margin: "0 0 8px 0" }}>No apps yet</p>
						<p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
							Drop files above or click "New App" to get started
						</p>
					</div>
				) : (
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
							gap: "20px"
						}}
					>
						{apps.map(app => (
							<div
								key={app.name}
								style={{
									backgroundColor: "rgba(26, 26, 26, 0.95)",
									border: "1px solid rgba(255, 255, 255, 0.1)",
									borderRadius: "12px",
									padding: "20px",
									transition: "all 0.2s ease"
								}}
								onMouseEnter={e => {
									e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
									e.currentTarget.style.transform = "translateY(-2px)";
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
									e.currentTarget.style.transform = "translateY(0)";
								}}
							>
								{/* Card Header */}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "flex-start",
										marginBottom: "12px"
									}}
								>
									<div
										style={{
											width: "40px",
											height: "40px",
											borderRadius: "8px",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "18px",
											background:
												app.type === "tsx"
													? "linear-gradient(135deg, #fbbf24, #f59e0b)"
													: "linear-gradient(135deg, #10b981, #059669)"
										}}
									>
										{app.type === "tsx" ? "⚡" : "🎨"}
									</div>
									<span
										style={{
											fontSize: "11px",
											padding: "4px 8px",
											borderRadius: "4px",
											fontWeight: "600",
											backgroundColor:
												app.type === "tsx"
													? "rgba(250, 204, 21, 0.2)"
													: "rgba(6, 182, 212, 0.2)",
											color: app.type === "tsx" ? "#facc15" : "#06b6d4"
										}}
									>
										{app.type.toUpperCase()}
									</span>
								</div>

								{/* Card Content */}
								<h3
									style={{
										fontSize: "16px",
										fontWeight: "600",
										margin: "0 0 4px 0",
										textTransform: "capitalize"
									}}
								>
									{app.name.replace(/-/g, " ")}
								</h3>
								<p
									style={{
										fontSize: "12px",
										color: "#6b7280",
										margin: "0 0 12px 0"
									}}
								>
									{app.metadata?.description ||
										`${app.type.toUpperCase()} application`}
								</p>

								{/* Meta Info */}
								<div
									style={{
										fontSize: "11px",
										color: "#6b7280",
										marginBottom: "16px"
									}}
								>
									<span>{formatSize(app.size)}</span>
									<span style={{ margin: "0 8px" }}>•</span>
									<span>{formatDate(app.modifiedAt)}</span>
									{app.metadata?.author && (
										<>
											<span style={{ margin: "0 8px" }}>•</span>
											<span>{app.metadata.author}</span>
										</>
									)}
								</div>

								{/* Actions */}
								<div
									style={{
										display: "flex",
										gap: "8px"
									}}
								>
									<a
										href={app.url}
										target="_blank"
										rel="noopener noreferrer"
										style={{
											flex: 1,
											padding: "8px",
											background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
											color: "white",
											border: "none",
											borderRadius: "6px",
											cursor: "pointer",
											fontWeight: "500",
											fontSize: "12px",
											textDecoration: "none",
											textAlign: "center"
										}}
									>
										Open
									</a>
									<button
										type="button"
										onClick={() => loadAppForEditing(app)}
										style={{
											padding: "8px 12px",
											backgroundColor: "rgba(255, 255, 255, 0.1)",
											color: "#ffffff",
											border: "none",
											borderRadius: "6px",
											cursor: "pointer",
											fontSize: "12px"
										}}
									>
										Edit
									</button>
									<button
										type="button"
										onClick={() => deleteApp(app.name)}
										style={{
											padding: "8px 12px",
											backgroundColor: "rgba(239, 68, 68, 0.2)",
											color: "#fca5a5",
											border: "none",
											borderRadius: "6px",
											cursor: "pointer",
											fontSize: "12px"
										}}
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
