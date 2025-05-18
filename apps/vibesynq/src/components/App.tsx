import { useRef, useState, type KeyboardEvent } from "react";
import Editor from "@monaco-editor/react";
import classNames from "classnames";
import type { editor as MonacoEditorTypes } from "monaco-editor";
import { useMount, useUnmount, useEvent, useLocalStorage } from "react-use";
import { toast } from "react-toastify";

import Header from "./header/header";
import DeployButton from "./deploy-button/deploy-button";
import { defaultHTML } from "./../../utils/consts";
import Tabs from "./tabs/tabs";
import AskAI from "./ask-ai/ask-ai";
import Preview from "./preview/preview";

function App() {
	const [htmlStorage, , removeHtmlStorage] = useLocalStorage("html_content");

	const preview = useRef<HTMLButtonElement>(null);
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const resizer = useRef<HTMLDivElement>(null);
	const editorRef = useRef<MonacoEditorTypes.IStandaloneCodeEditor | null>(null);

	const [isResizing, setIsResizing] = useState(false);
	const [, setError] = useState(false);
	const [html, setHtml] = useState<string>((htmlStorage as string) ?? defaultHTML);
	const [isAiWorking, setisAiWorking] = useState(false);
	const [currentView, setCurrentView] = useState<"editor" | "preview">("editor");
	const [, setPrompts] = useState<string[]>([]);

	/**
	 * Resets the layout based on screen size
	 * - For desktop: Sets editor to 1/3 width and preview to 2/3
	 * - For mobile: Removes inline styles to let CSS handle it
	 */
	const resetLayout = () => {
		if (!editorContainerRef.current || !preview.current) return;

		// lg breakpoint is 1024px based on useBreakpoint definition and Tailwind defaults
		if (window.innerWidth >= 1024) {
			// Set initial 1/3 - 2/3 sizes for large screens, accounting for resizer width
			const resizerWidth = resizer.current?.offsetWidth ?? 8; // w-2 = 0.5rem = 8px
			const availableWidth = window.innerWidth - resizerWidth;
			const initialEditorWidth = availableWidth / 3; // Editor takes 1/3 of space
			const initialPreviewWidth = availableWidth - initialEditorWidth; // Preview takes 2/3
			editorContainerRef.current.style.width = `${initialEditorWidth}px`;
			preview.current.style.width = `${initialPreviewWidth}px`;
		} else {
			// Remove inline styles for smaller screens, let CSS flex-col handle it
			editorContainerRef.current.style.width = "";
			preview.current.style.width = "";
		}
	};

	/**
	 * Handles resizing when the user drags the resizer
	 * Ensures minimum widths are maintained for both panels
	 */
	const handleResize = (e: MouseEvent) => {
		if (!editorContainerRef.current || !preview.current || !resizer.current) return;

		const resizerWidth = resizer.current.offsetWidth;
		const minWidth = 100; // Minimum width for editor/preview
		const maxWidth = window.innerWidth - resizerWidth - minWidth;

		const editorWidth = e.clientX;
		const clampedEditorWidth = Math.max(minWidth, Math.min(editorWidth, maxWidth));
		const calculatedPreviewWidth = window.innerWidth - clampedEditorWidth - resizerWidth;

		editorContainerRef.current.style.width = `${clampedEditorWidth}px`;
		preview.current.style.width = `${calculatedPreviewWidth}px`;
	};

	const handleMouseDown = () => {
		setIsResizing(true);
		document.addEventListener("mousemove", handleResize);
		document.addEventListener("mouseup", handleMouseUp);
	};

	const handleMouseUp = () => {
		setIsResizing(false);
		document.removeEventListener("mousemove", handleResize);
		document.removeEventListener("mouseup", handleMouseUp);
	};

	// Prevent accidental navigation away when AI is working or content has changed
	useEvent("beforeunload", (e: BeforeUnloadEvent) => {
		if (isAiWorking || html !== defaultHTML) {
			e.preventDefault();
			return "";
		}
	});

	// Initialize component on mount
	useMount(() => {
		// Restore content from storage if available
		if (htmlStorage) {
			removeHtmlStorage();
			toast.warn("Previous HTML content restored from local storage.");
		}

		// Set initial layout based on window size
		resetLayout();

		// Attach event listeners
		if (!resizer.current) return;
		resizer.current.addEventListener("mousedown", handleMouseDown);
		window.addEventListener("resize", resetLayout);
	});

	// Clean up event listeners on unmount
	useUnmount(() => {
		document.removeEventListener("mousemove", handleResize);
		document.removeEventListener("mouseup", handleMouseUp);
		if (resizer.current) {
			resizer.current.removeEventListener("mousedown", handleMouseDown);
		}
		window.removeEventListener("resize", resetLayout);
	});

	return (
		<div className="h-screen bg-gray-950 font-sans overflow-hidden">
			<Header
				onReset={() => {
					if (isAiWorking) {
						toast.warn("Please wait for the AI to finish working.");
						return;
					}
					if (window.confirm("You're about to reset the editor. Are you sure?")) {
						setHtml(defaultHTML);
						setError(false);
						removeHtmlStorage();
						editorRef.current?.revealLine(
							editorRef.current?.getModel()?.getLineCount() ?? 0
						);
					}
				}}
			>
				<DeployButton html={html} />
			</Header>
			<main className="max-lg:flex-col flex w-full">
				<div
					ref={editorContainerRef}
					className={classNames(
						"w-full h-[calc(100dvh-49px)] lg:h-[calc(100dvh-54px)] relative overflow-hidden max-lg:transition-all max-lg:duration-200 select-none",
						{
							"max-lg:h-0": currentView === "preview"
						}
					)}
				>
					<Tabs />
					<fieldset
						onClick={e => {
							if (isAiWorking) {
								e.preventDefault();
								e.stopPropagation();
								toast.warn("Please wait for the AI to finish working.");
							} else {
								editorRef.current?.focus();
							}
						}}
						onKeyDown={(e: KeyboardEvent<HTMLFieldSetElement>) => {
							if (e.key === "Enter" || e.key === " ") {
								if (!isAiWorking) {
									editorRef.current?.focus();
								}
							}
						}}
					>
						<Editor
							language="html"
							theme="vs-dark"
							className={classNames(
								"h-[calc(100dvh-90px)] lg:h-[calc(100dvh-96px)]",
								{
									"pointer-events-none": isAiWorking
								}
							)}
							value={html}
							onValidate={(markers: MonacoEditorTypes.IMarker[]) => {
								if (markers?.length > 0) {
									setError(true);
								}
							}}
							onChange={(value: string | undefined) => {
								const newValue = value ?? "";
								setHtml(newValue);
								setError(false);
							}}
							onMount={(editorInstance: MonacoEditorTypes.IStandaloneCodeEditor) => {
								editorRef.current = editorInstance;
							}}
						/>
					</fieldset>
					<AskAI
						html={html}
						defaultHTML={defaultHTML}
						setHtml={setHtml}
						isAiWorking={isAiWorking}
						setisAiWorking={setisAiWorking}
						setView={setCurrentView}
						onNewPrompt={prompt => {
							setPrompts(prev => [...prev, prompt]);
						}}
						onScrollToBottom={() => {
							editorRef.current?.revealLine(
								editorRef.current?.getModel()?.getLineCount() ?? 0
							);
						}}
					/>
				</div>
				<div
					ref={resizer}
					className="bg-gray-700 hover:bg-blue-500 w-2 cursor-col-resize h-[calc(100dvh-53px)] max-lg:hidden"
				/>
				<Preview
					html={html}
					isResizing={isResizing}
					isAiWorking={isAiWorking}
					ref={preview}
					setView={setCurrentView}
				/>
			</main>
		</div>
	);
}

export default App;
