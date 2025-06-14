import { useState, useRef, useEffect } from "react";
import { useChat, useNicknames, useIsTogether } from "react-together";

interface ChatMessage {
	id: string;
	senderId: string;
	message: string;
	sentAt: number;
}

interface ChatComponentProps {
	isOpen: boolean;
	onClose: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ isOpen, onClose }) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const chatRef = useRef<HTMLDivElement>(null);

	// Use react-together hooks directly
	const isTogether = useIsTogether();
	const [myNickname] = useNicknames();
	const { messages, sendMessage } = useChat("beach-chat");

	// Local state for message input
	const [messageText, setMessageText] = useState("");

	// Use a ref to track whether we need to scroll
	const shouldScrollToBottom = useRef(false);

	// Set scroll flag when messages change
	useEffect(() => {
		// Only set scroll flag if chat is open
		if (isOpen) {
			shouldScrollToBottom.current = true;
		}
	}, [isOpen]);

	// Perform the actual scrolling after render
	useEffect(() => {
		if (shouldScrollToBottom.current && messagesEndRef.current && isOpen) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
			shouldScrollToBottom.current = false;
		}
	});

	// Also scroll when chat is opened
	useEffect(() => {
		if (isOpen && messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [isOpen]);

	// Focus input when chat opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Prevent movement keys when chat is open
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Explicitly stop propagation for movement keys
			if (
				["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyN", "KeyP", "KeyT", "KeyF"].includes(
					e.code
				)
			) {
				e.stopPropagation();
			}

			// Close chat on Escape
			if (e.code === "Escape") {
				e.stopPropagation();
				e.preventDefault();
				onClose();
			}
		};

		// Handle clicks outside chat to close it
		const handleOutsideClick = (e: MouseEvent) => {
			if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		// Use capture phase to intercept events before they reach other handlers
		window.addEventListener("keydown", handleKeyDown, true);
		document.addEventListener("mousedown", handleOutsideClick);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
			document.removeEventListener("mousedown", handleOutsideClick);
		};
	}, [isOpen, onClose]);

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (messageText.trim() !== "") {
			try {
				if (isTogether) {
					sendMessage(messageText);
					setMessageText("");
					// Set scroll flag when sending messages
					shouldScrollToBottom.current = true;
				} else {
					console.log("Cannot send message outside of a session");
					setMessageText("");
				}
			} catch (error) {
				console.error("Failed to send message:", error);
			}
		}
	};

	if (!isOpen) return null;

	return (
		<div
			ref={chatRef}
			className="fixed bottom-4 right-4 w-80 h-96 bg-black/70 backdrop-blur-sm rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden z-50"
		>
			{/* Chat header */}
			<div className="px-4 py-3 bg-black/30 border-b border-white/10 flex justify-between items-center">
				<h3 className="text-white font-bold">Beach Chat</h3>
				<div className="flex items-center">
					<div className="text-xs text-white/70 mr-2">ESC to close</div>
					<button
						type="button"
						onClick={e => {
							e.stopPropagation();
							onClose();
						}}
						className="text-white/70 hover:text-white"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-labelledby="close-title"
						>
							<title id="close-title">Close</title>
							<path
								fillRule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Messages container */}
			<div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
				{!isTogether ? (
					<div className="text-red-300 text-center mt-4 p-3 bg-red-500/20 rounded-lg">
						You're not connected to a multiplayer session. Chat is unavailable.
					</div>
				) : messages.length === 0 ? (
					<div className="text-white/50 text-center mt-4">
						No messages yet. Start the conversation!
					</div>
				) : (
					messages.map(msg => (
						<div
							key={msg.id}
							className={`mb-3 ${msg.senderId === myNickname ? "text-right" : "text-left"}`}
						>
							<div
								className={`inline-block px-3 py-2 rounded-lg ${
									msg.senderId === myNickname
										? "bg-blue-500/70 text-white"
										: "bg-white/10 text-white"
								}`}
							>
								{msg.senderId !== myNickname && (
									<div className="text-xs text-blue-300 mb-1 font-medium">
										{msg.senderId}
									</div>
								)}
								<div>{msg.message}</div>
								<div className="text-xs opacity-50 mt-1">
									{new Date(msg.sentAt).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit"
									})}
								</div>
							</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Message input */}
			<form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-black/20">
				<div className="flex">
					<input
						ref={inputRef}
						type="text"
						value={messageText}
						onChange={e => setMessageText(e.target.value)}
						placeholder={
							isTogether ? "Type a message..." : "Chat unavailable in single player"
						}
						className="flex-1 bg-white/10 text-white border border-white/20 rounded-l-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
						disabled={!isTogether}
						onKeyDown={e => {
							// Prevent game controls from triggering
							if (
								[
									"KeyW",
									"KeyA",
									"KeyS",
									"KeyD",
									"Space",
									"KeyN",
									"KeyP",
									"KeyT",
									"KeyF"
								].includes(e.code)
							) {
								e.stopPropagation();
							}
							if (e.key === "Tab" || e.key === "Escape") {
								e.preventDefault();
								if (e.key === "Escape") onClose();
							}
						}}
					/>
					<button
						type="submit"
						disabled={!isTogether}
						className={`${isTogether ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-500/50 cursor-not-allowed"} text-white px-4 rounded-r-lg transition-colors`}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-labelledby="send-title"
						>
							<title id="send-title">Send</title>
							<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
						</svg>
					</button>
				</div>
			</form>
		</div>
	);
};

export default ChatComponent;
