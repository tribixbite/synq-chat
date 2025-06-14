import type React from "react";
import { useState, useEffect } from "react";

interface KeyboardShortcutsProps {
	isVisible: boolean;
	onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isVisible, onClose }) => {
	const [shouldShow, setShouldShow] = useState(false);

	useEffect(() => {
		if (isVisible) {
			setShouldShow(true);
		} else {
			const timer = setTimeout(() => setShouldShow(false), 300);
			return () => clearTimeout(timer);
		}
	}, [isVisible]);

	if (!shouldShow) return null;

	return (
		<div
			className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
		>
			<div
				className={`bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
			>
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-white/70 hover:text-white"
						aria-label="Close shortcuts"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<title>Close</title>
							<path
								fillRule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h3 className="text-xl font-semibold mb-3 text-blue-400">Movement</h3>
						<ul className="space-y-2">
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									W A S D
								</span>
								<span>Move around</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									Mouse
								</span>
								<span>Look around</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									Space
								</span>
								<span>Jump</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									F
								</span>
								<span>Toggle fly mode</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									Q E
								</span>
								<span>Up/down in fly mode</span>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl font-semibold mb-3 text-purple-400">Interface</h3>
						<ul className="space-y-2">
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									H
								</span>
								<span>Hide/show UI</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									T
								</span>
								<span>Toggle wireframe mode</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									Esc
								</span>
								<span>Release mouse pointer</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									?
								</span>
								<span>Show/hide this menu</span>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl font-semibold mb-3 text-green-400">Music</h3>
						<ul className="space-y-2">
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									P
								</span>
								<span>Mute/unmute music</span>
							</li>
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									N
								</span>
								<span>Skip to next song</span>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl font-semibold mb-3 text-cyan-400">Multiplayer</h3>
						<ul className="space-y-2">
							<li className="flex items-center">
								<span className="bg-white/10 px-2 py-1 rounded font-mono text-sm mr-3 min-w-[60px] text-center">
									C
								</span>
								<span>Toggle chat window</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-6 pt-4 border-t border-white/10 text-center text-sm text-white/70">
					Press{" "}
					<span className="bg-white/10 px-2 py-1 rounded font-mono text-xs">ESC</span> to
					close this menu
				</div>
			</div>
		</div>
	);
};

export default KeyboardShortcuts;
