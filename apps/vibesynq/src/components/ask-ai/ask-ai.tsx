/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { RiSparkling2Fill } from "react-icons/ri";
import { GrSend } from "react-icons/gr";
import classNames from "classnames";
import { toast } from "react-toastify";
import { useLocalStorage } from "react-use";
import { MdPreview } from "react-icons/md";

import Login from "../login/login";
import SuccessSound from "@assets/success.mp3";
import Settings from "../settings/settings";
import ProModal from "../pro-modal/pro-modal";

interface LocalSettings {
	// Generic settings
	apiKey?: string;
	apiUrl?: string;
	model?: string;

	// Provider-specific settings
	openRouterApiKey?: string;
	openRouterApiUrl?: string;
	openRouterModel?: string;

	anthropicApiKey?: string;
	anthropicModel?: string;

	openaiApiKey?: string;
	openaiModel?: string;

	googleApiKey?: string;
	googleModel?: string;

	xaiApiKey?: string;
	xaiModel?: string;

	chutesApiKey?: string;
	chutesModel?: string;

	groqApiKey?: string;
	groqModel?: string;

	togetherApiKey?: string;
	togetherModel?: string;
}

const initialLocalSettings: LocalSettings = {
	apiKey: "",
	apiUrl: "http://localhost:11434/v1",
	model: "gemma3:1b",
	openRouterApiKey: "",
	openRouterApiUrl: "https://openrouter.ai/api/v1",
	openRouterModel: "deepseek/deepseek-chat-v3-0324:free"
};

interface AskAIProps {
	html: string;
	defaultHTML: string;
	setHtml: (html: string) => void;
	onScrollToBottom: () => void;
	isAiWorking: boolean;
	setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
	setView: React.Dispatch<React.SetStateAction<"editor" | "preview">>;
	onNewPrompt: (prompt: string) => void;
}

interface AskAiRequestBody {
	prompt: string;
	provider: string | null | undefined; // from useLocalStorage
	html?: string;
	previousPrompt?: string;
	localSettings?: LocalSettings;
}

function AskAI({
	html,
	defaultHTML,
	setHtml,
	onScrollToBottom,
	isAiWorking,
	setisAiWorking,
	setView,
	onNewPrompt
}: AskAIProps) {
	const [open, setOpen] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [hasAsked, setHasAsked] = useState(false);
	const [previousPrompt, setPreviousPrompt] = useState("");
	const [provider, setProvider] = useLocalStorage("provider", "auto");
	const [openProvider, setOpenProvider] = useState(false);
	const [providerError, setProviderError] = useState("");
	const [openProModal, setOpenProModal] = useState(false);
	const [localSettings, setLocalSettings] = useState<LocalSettings>(() => {
		const saved = localStorage.getItem("localSettings");
		// Ensure what's parsed is compatible with LocalSettings or use initial
		try {
			return saved ? { ...initialLocalSettings, ...JSON.parse(saved) } : initialLocalSettings;
		} catch {
			return initialLocalSettings;
		}
	});

	const loadLocalSettings = useCallback(() => {
		const saved = localStorage.getItem("localSettings");
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				setLocalSettings({ ...initialLocalSettings, ...parsed });
			} catch (e) {
				console.error("Failed to parse localSettings from localStorage", e);
				setLocalSettings(initialLocalSettings);
			}
		} else {
			setLocalSettings(initialLocalSettings);
		}
	}, []);

	useEffect(() => {
		loadLocalSettings();
	}, [loadLocalSettings]);

	// Audio handling - create only once and handle properly
	const [audio] = useState(() => {
		const audioInstance = new Audio(SuccessSound);
		audioInstance.volume = 0.5;
		return audioInstance;
	});

	const callAi = async () => {
		if (isAiWorking || !prompt.trim()) return;
		setisAiWorking(true);
		setProviderError("");

		let contentResponse = "";
		let lastRenderTime = 0;
		try {
			onNewPrompt(prompt);
			const requestBody: AskAiRequestBody = {
				prompt,
				provider,
				localSettings
			};

			if (html !== defaultHTML) {
				requestBody.html = html;
			}
			if (previousPrompt) {
				requestBody.previousPrompt = previousPrompt;
			}

			const request = await fetch("/api/vibesynq-ai", {
				method: "POST",
				body: JSON.stringify(requestBody),
				headers: {
					"Content-Type": "application/json"
				}
			});
			if (request?.body) {
				if (!request.ok) {
					const res = await request.json();
					if (res.openLogin) {
						setOpen(true);
					} else if (res.openSelectProvider) {
						setOpenProvider(true);
						setProviderError(res.message);
					} else if (res.openProModal) {
						setOpenProModal(true);
					} else {
						toast.error(res.message);
					}
					setisAiWorking(false);
					return;
				}
				const reader = request.body.getReader();
				const decoder = new TextDecoder("utf-8");

				const read = async () => {
					const { done, value } = await reader.read();
					if (done) {
						toast.success("AI responded successfully");
						setPrompt("");
						setPreviousPrompt(prompt);
						setisAiWorking(false);
						setHasAsked(true);
						// Play success sound with error handling
						try {
							audio.play().catch(e => console.log("Audio play failed:", e));
						} catch (e) {
							console.log("Audio play error:", e);
						}
						setView("preview");

						// Now we have the complete HTML including </html>, so set it to be sure
						const finalDoc = contentResponse.match(
							/<!DOCTYPE html>[\s\S]*<\/html>/
						)?.[0];
						if (finalDoc) {
							setHtml(finalDoc);
						}

						return;
					}

					const chunk = decoder.decode(value, { stream: true });
					contentResponse += chunk;
					const newHtml = contentResponse.match(/<!DOCTYPE html>[\s\S]*/)?.[0];
					if (newHtml) {
						// Force-close the HTML tag so the iframe doesn't render half-finished markup
						let partialDoc = newHtml;
						if (!partialDoc.includes("</html>")) {
							partialDoc += "\n</html>";
						}

						// Throttle the re-renders to avoid flashing/flicker
						const now = Date.now();
						if (now - lastRenderTime > 300) {
							setHtml(partialDoc);
							lastRenderTime = now;
						}

						if (partialDoc.length > 200) {
							onScrollToBottom();
						}
					}
					read();
				};

				read();
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: unknown) {
			setisAiWorking(false);
			toast.error((error as Error).message);
			if ((error as { openLogin?: boolean }).openLogin) {
				setOpen(true);
			}
		}
	};

	return (
		<div
			className={`bg-gray-950 rounded-xl py-2 lg:py-2.5 pl-3.5 lg:pl-4 pr-2 lg:pr-2.5 absolute lg:sticky bottom-3 left-3 lg:bottom-4 lg:left-4 w-[calc(100%-1.5rem)] lg:w-[calc(100%-2rem)] z-10 group ${
				isAiWorking ? "animate-pulse" : ""
			}`}
		>
			{defaultHTML !== html && (
				<button
					type="button"
					className="bg-white lg:hidden -translate-y-[calc(100%+8px)] absolute left-0 top-0 shadow-md text-gray-950 text-xs font-medium py-2 px-3 lg:px-4 rounded-lg flex items-center gap-2 border border-gray-100 hover:brightness-150 transition-all duration-100 cursor-pointer"
					onClick={() => setView("preview")}
				>
					<MdPreview className="text-sm" />
					View Preview
				</button>
			)}
			<div className="w-full relative flex items-center justify-between">
				<RiSparkling2Fill className="text-lg lg:text-xl text-gray-500 group-focus-within:text-pink-500" />
				<input
					type="text"
					disabled={isAiWorking}
					className="w-full bg-transparent max-lg:text-sm outline-none px-3 text-white placeholder:text-gray-500 font-code"
					placeholder={
						hasAsked ? "What do you want to ask AI next?" : "Ask AI anything..."
					}
					value={prompt}
					onChange={e => setPrompt(e.target.value)}
					onKeyDown={e => {
						if (e.key === "Enter") {
							callAi();
						}
					}}
				/>
				<div className="flex items-center justify-end gap-2">
					<Settings
						provider={provider as string}
						onChange={setProvider}
						open={openProvider}
						error={providerError}
						onClose={setOpenProvider}
						setLocalSettings={setLocalSettings}
						localSettings={localSettings}
					/>
					<button
						type="button"
						disabled={isAiWorking}
						className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-sm font-semibold size-8 text-center bg-pink-500 hover:bg-pink-400 text-white shadow-sm dark:shadow-highlight/20 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
						onClick={callAi}
					>
						<GrSend className="-translate-x-[1px]" />
					</button>
				</div>
			</div>
			<button
				type="button"
				aria-label="Close modal"
				className={classNames("h-screen w-screen bg-black/20 fixed left-0 top-0 z-10", {
					"opacity-0 pointer-events-none": !open,
					"cursor-default": !open // to avoid button cursor when not active
				})}
				onClick={() => setOpen(false)}
				disabled={!open} // Disable when not open
			/>
			<div
				className={classNames(
					"absolute top-0 -translate-y-[calc(100%+8px)] right-0 z-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-75 overflow-hidden",
					{
						"opacity-0 pointer-events-none": !open
					}
				)}
			>
				<Login html={html}>
					<p className="text-gray-500 text-sm mb-3">
						You reached the limit of free AI usage. Please login to continue.
					</p>
				</Login>
			</div>
			<ProModal html={html} open={openProModal} onClose={() => setOpenProModal(false)} />
		</div>
	);
}

export default AskAI;
