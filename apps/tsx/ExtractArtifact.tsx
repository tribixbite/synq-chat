import React, { useState } from "react";

// --- Helper Components & Icons (Embedded for standalone use) ---

const IconClipboard = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<title>Clipboard</title>
		<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
		<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
	</svg>
);

const IconDownload = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<title>Download</title>
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" x2="12" y1="15" y2="3" />
	</svg>
);

const IconEdit = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<title>Edit</title>
		<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
		<path d="m15 5 4 4" />
	</svg>
);

const IconLoader = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={`${className} animate-spin`}
	>
		<title>Loading</title>
		<line x1="12" y1="2" x2="12" y2="6" />
		<line x1="12" y1="18" x2="12" y2="22" />
		<line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
		<line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
		<line x1="2" y1="12" x2="6" y2="12" />
		<line x1="18" y1="12" x2="22" y2="12" />
		<line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
		<line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
	</svg>
);

const CodeDisplay = ({ code }: { code: string }) => (
	<div className="mt-6 w-full bg-gray-900/70 border border-purple-500/20 rounded-lg shadow-inner max-h-[40vh] overflow-auto">
		<pre className="p-4 text-sm text-gray-200 whitespace-pre-wrap break-words">
			<code>{code}</code>
		</pre>
	</div>
);

// --- Main Application Component ---

export default function App() {
	const [url, setUrl] = useState("");
	const [extractedCode, setExtractedCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [filename, setFilename] = useState("extracted-code.txt");

	/**
	 * Simulates fetching HTML content from a URL.
	 * NOTE: In a real application, this would be a backend call to a proxy server
	 * to bypass browser CORS restrictions. The proxy would fetch the URL content
	 * and return it to the frontend.
	 */
	const fetchUrlContentMock = async (targetUrl: string): Promise<string> => {
		return new Promise((resolve, reject) => {
			setIsLoading(true);
			setTimeout(() => {
				if (targetUrl.includes("claude.ai/share/")) {
					setFilename("claude-app.tsx");
					// Mock HTML structure for a Claude share page
					resolve(`
            <html>
              <body>
                <div class="prose">
                  <p>Here is the React component:</p>
                  <div class="font-mono bg-black text-white p-4 rounded">import React from 'react';\n\nexport default function MyComponent() { return <div>Hello from Claude</div>; }</div>
                  <p>And some CSS to go with it:</p>
                  <div class="font-mono bg-black text-white p-4 rounded">body { background: #111; }</div>
                </div>
              </body>
            </html>
          `);
				} else if (targetUrl.includes("chat.openai.com/share/")) {
					setFilename("chatgpt-app.html");
					// Mock HTML structure for a ChatGPT share page
					resolve(`
            <html>
              <body>
                <div class="text-base">
                  <p>Sure, here's an HTML file:</p>
                  <div class="bg-black rounded-md">
                    <pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;body&gt;
    &lt;h1&gt;Hello from ChatGPT&lt;/h1&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
                  </div>
                </div>
              </body>
            </html>
          `);
				} else {
					reject(
						new Error(
							"Invalid or unsupported URL. Please use a Claude or ChatGPT share URL."
						)
					);
				}
			}, 1500);
		});
	};

	const parseHtmlContent = (html: string, sourceUrl: string): string => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		let codeBlocks: NodeListOf<HTMLElement>;

		if (sourceUrl.includes("claude.ai/share/")) {
			// Claude tends to put code in divs with a monospace font style
			codeBlocks = doc.querySelectorAll('div[class*="font-mono"]');
		} else if (sourceUrl.includes("chat.openai.com/share/")) {
			// ChatGPT often uses a standard pre > code structure
			codeBlocks = doc.querySelectorAll("pre code");
		} else {
			throw new Error("Could not determine parser for this URL.");
		}

		if (codeBlocks.length === 0) {
			throw new Error(
				"No code blocks found on the page. The page structure might have changed."
			);
		}

		// Join the content of all found code blocks
		return Array.from(codeBlocks)
			.map(block => block.textContent || "")
			.join("\n\n");
	};

	const handleFetchCode = async () => {
		if (!url.trim()) {
			setError("Please enter a URL.");
			return;
		}
		setError("");
		setExtractedCode("");

		try {
			const htmlContent = await fetchUrlContentMock(url);
			const code = parseHtmlContent(htmlContent, url);
			setExtractedCode(code);
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("An unknown error occurred.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText();
			setUrl(text);
		} catch (err) {
			setError("Failed to read from clipboard. Please paste manually.");
		}
	};

	const handleDownload = () => {
		if (!extractedCode) return;
		const blob = new Blob([extractedCode], { type: "text/plain;charset=utf-8" });
		const href = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = href;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(href);
	};

	// This is a placeholder function. In a real integration with VibeSynq,
	// this would call a prop function or use a global state manager
	// to send the code to the main editor.
	const handleEditInVibeSynq = () => {
		alert(
			`--- VibeSynq Integration --- \nCode would now be sent to the main editor. \n\n${extractedCode}`
		);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
			<div className="w-full max-w-2xl mx-auto text-center">
				<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
					Share URL Extractor
				</h1>
				<p className="text-gray-400 mb-8">
					Paste a Claude or ChatGPT share link to pull out and download the code.
				</p>

				<div className="relative w-full mb-4">
					<input
						type="text"
						value={url}
						onChange={e => setUrl(e.target.value)}
						placeholder="https://claude.ai/share/..."
						className="w-full p-4 pr-32 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition duration-200"
						disabled={isLoading}
					/>
					<button
						type="button"
						onClick={handlePaste}
						disabled={isLoading}
						className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
					>
						<IconClipboard className="w-5 h-5" />
						Paste
					</button>
				</div>

				<button
					type="button"
					onClick={handleFetchCode}
					disabled={isLoading}
					className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-lg flex items-center justify-center gap-3 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
				>
					{isLoading ? (
						<>
							<IconLoader className="w-6 h-6" />
							Extracting Code...
						</>
					) : (
						"Fetch & Extract Code"
					)}
				</button>

				{error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}

				{extractedCode && (
					<div className="mt-8 text-left w-full animate-fade-in transition-opacity duration-500">
						<h2 className="text-xl font-semibold mb-4 text-gray-200">
							Extracted Code:
						</h2>
						<CodeDisplay code={extractedCode} />
						<div className="mt-6 flex flex-col sm:flex-row gap-4">
							<button
								type="button"
								onClick={handleDownload}
								className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
							>
								<IconDownload className="w-5 h-5" />
								Download {filename}
							</button>
							<button
								type="button"
								onClick={handleEditInVibeSynq}
								className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
							>
								<IconEdit className="w-5 h-5" />
								Edit in VibeSynq
							</button>
						</div>
					</div>
				)}

				<div className="mt-12 text-center text-xs text-gray-500">
					<p className="font-bold">Note on CORS:</p>
					<p>
						This app simulates fetching URL content. A real-world version requires a
						backend proxy to bypass browser security policies.
					</p>
				</div>
			</div>
		</div>
	);
}

// Add a simple fade-in animation for when content appears
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;
document.head.append(style);
