import { useEffect, useRef, useState } from "react";
import SceneManager from "./three/SceneManager";
import FogDensitySlider from "./components/FogDensitySlider";
import VolumeSlider from "./components/VolumeSlider";
import FPSCounter from "./components/FPSCounter";
import BuildDate from "./components/BuildDate";
import SongTitle from "./components/SongTitle";
import type { SongChangeEvent } from "./three/Jukebox";
import {
	useStateTogetherWithPerUserValues,
	useMyId,
	useNicknames,
	useIsTogether,
	utils as rtUtils
} from "react-together";
import Minimap from "./components/Minimap";
import ChatComponent from "./components/ChatComponent";

// Define PlayerPosition type (can be moved to a types.ts file later)
interface PlayerPosition {
	x: number;
	y: number;
	z: number;
	rotationY: number; // For character orientation
}

function App() {
	const sceneManagerRef = useRef<SceneManager | null>(null);
	const [isGuiVisible, setIsGuiVisible] = useState(true);
	const [currentSong, setCurrentSong] = useState<string>("");
	const [showSongTitle, setShowSongTitle] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);

	// React Together hooks
	const myId = useMyId();
	const isTogether = useIsTogether();
	const [_myNickname, setMyNickname, allNicknames] = useNicknames();
	const [_myPlayerPosition, setMyPlayerPosition, allPlayerPositions] =
		useStateTogetherWithPerUserValues<PlayerPosition | null>("player-positions", null, {
			throttleDelay: 50 // Update positions roughly 20 times per second
		});

	// ADD THIS LOGGING

	// For more detailed inspection if needed, uncomment these:
	// if (Object.keys(allNicknames || {}).length > 0) console.log("allNicknames:", allNicknames);
	// if (Object.keys(allPlayerPositions || {}).length > 0) console.log("allPlayerPositions:", allPlayerPositions);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		console.log("App.tsx render state:", {
			isGuiVisible,
			isTogether,
			myId,
			isChatOpen,
			allNicknamesCount: Object.keys(allNicknames || {}).length,
			allPlayerPositionsCount: Object.keys(allPlayerPositions || {}).length
		});
		const sceneManager = new SceneManager();
		sceneManagerRef.current = sceneManager;

		// Handle window resize
		const handleResize = () => {
			sceneManager.onWindowResize();
		};

		// Handle keyboard events
		const handleKeyDown = (event: KeyboardEvent) => {
			// Let ChatComponent handle keyboard events when chat is open
			if (isChatOpen) {
				// ChatComponent has its own keyboard event handler (with capture phase)
				// that will prevent movement keys and handle Escape for us
				return;
			}

			// If any other input is focused but chat isn't open yet
			if (
				document.activeElement instanceof HTMLInputElement ||
				document.activeElement instanceof HTMLTextAreaElement
			) {
				return; // Let them type normally
			}

			// Keys that work when chat is closed
			switch (event.key) {
				case "/":
					if (isTogether) {
						event.preventDefault();
						setIsChatOpen(true);
					}
					break;
				case "c":
				case "C":
					if (isTogether) {
						setIsChatOpen(true);
					}
					break;
				case "h":
				case "H":
					setIsGuiVisible(prev => !prev);
					break;
				case "p":
				case "P":
					sceneManagerRef.current?.getJukebox()?.togglePlay();
					break;
				// Add other non-input global keybinds here
			}
		};

		// Handle song change events
		const handleSongChange = (event: Event) => {
			const songEvent = event as SongChangeEvent;
			setCurrentSong(songEvent.songTitle);
			setShowSongTitle(true);
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("keydown", handleKeyDown);
		document.addEventListener("songchange", handleSongChange);

		// Clean up on unmount
		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("songchange", handleSongChange);
			sceneManager.dispose();
		};
	}, [isTogether]);

	// Effect to update local player's position for sharing
	useEffect(() => {
		if (!sceneManagerRef.current || !setMyPlayerPosition) return;

		const updateInterval = setInterval(() => {
			const playerTransform = sceneManagerRef.current?.getPlayerTransform(); // Assumed method
			if (playerTransform) {
				setMyPlayerPosition(playerTransform);
			}
		}, 100); // Update 10 times per second

		return () => clearInterval(updateInterval);
	}, [setMyPlayerPosition]); // Re-run if setMyPlayerPosition changes (should be stable)

	// Effect to update remote player visuals in Three.js scene
	useEffect(() => {
		if (!sceneManagerRef.current || !myId) return;

		// Filter out null positions and own position before passing to SceneManager
		const remotePlayerPositions: Record<string, PlayerPosition> = {};
		for (const [userId, pos] of Object.entries(allPlayerPositions)) {
			if (userId !== myId && pos) {
				remotePlayerPositions[userId] = pos;
			}
		}
		sceneManagerRef.current.updateRemotePlayerVisuals(remotePlayerPositions, allNicknames); // Pass allNicknames to updateRemotePlayerVisuals
	}, [allPlayerPositions, myId, allNicknames]); // Re-run when positions change or myId changes

	const handleReset = () => {
		sceneManagerRef.current?.resetCamera();
	};

	const handleFogDensityChange = (density: number) => {
		sceneManagerRef.current?.setFogDensity(density);
	};

	const handleVolumeChange = (volume: number) => {
		const jukebox = sceneManagerRef.current?.getJukebox();
		if (jukebox) {
			jukebox.setVolume(volume);
			setIsMuted(jukebox.getMutedState());
		}
	};

	return (
		<div className="fixed inset-0 bg-black">
			<canvas id="scene-canvas" className="w-full h-full block" />
			{isGuiVisible && <FPSCounter />}
			{isGuiVisible && isTogether && myId && (
				<Minimap
					allPlayerPositions={allPlayerPositions}
					myId={myId}
					allNicknames={allNicknames}
					worldSize={sceneManagerRef.current?.getWorldDimensions() ?? undefined}
				/>
			)}
			{isGuiVisible && isTogether && (
				<ChatComponent isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
			)}
			{isGuiVisible && (
				<div className="absolute bottom-4 left-4 text-white bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-2xl border border-white/10 max-w-xs z-0">
					<div className="text-sm">
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-blue-400 rounded-full" />
							<span>Use WASD to move, mouse to look around</span>
						</div>
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-purple-400 rounded-full" />
							<span>SPACE to jump, F to toggle fly mode</span>
						</div>
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-pink-400 rounded-full" />
							<span>T to toggle wireframe mode, H to toggle GUI</span>
						</div>
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-green-400 rounded-full" />
							<span>Press P to mute/unmute music and N to skip songs</span>
						</div>
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-yellow-400 rounded-full" />
							<span>Press ESC to unlock the mouse</span>
						</div>
						{isTogether && !isChatOpen && (
							<div className="flex items-center gap-2 mb-2 text-cyan-300">
								<span className="w-2 h-2 bg-cyan-400 rounded-full" />
								<span>Press '/' to open chat</span>
							</div>
						)}
						{window.innerWidth > 640 && (
							<div className="flex items-center gap-2 mt-2 text-gray-300">
								<span className="w-2 h-2 bg-yellow-400 rounded-full" />
								<span>Q/E for up/down in fly mode</span>
							</div>
						)}
					</div>
				</div>
			)}
			{isGuiVisible && (
				<div className="absolute top-4 right-4 flex flex-col items-stretch gap-3 p-3 bg-black/50 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 z-20 w-64">
					<BuildDate />
					{/* <a Credit for 99% of this code goes to:
            href="https://github.com/bramtechs/vibe-beach"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm hover:from-black/80 hover:to-black/60 text-white px-4 py-2.5 rounded-lg shadow-xl border border-white/10 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            Fork on GitHub!
          </a> */}
					<button
						onClick={handleReset}
						type="button"
						className="w-full bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm hover:from-black/80 hover:to-black/60 text-white px-4 py-2.5 rounded-lg shadow-xl border border-white/10 transition-all duration-300 text-sm font-medium"
					>
						Reset Position
					</button>
					<FogDensitySlider onChange={handleFogDensityChange} />
					<VolumeSlider onChange={handleVolumeChange} />
				</div>
			)}
			{isGuiVisible && (
				<SongTitle title={currentSong} isVisible={showSongTitle} isMuted={isMuted} />
			)}
		</div>
	);
}

export default App;
