import type React from "react";
import { useEffect, useState } from "react";

interface SongTitleProps {
	title: string;
	isVisible: boolean;
	isMuted: boolean;
}

const SongTitle: React.FC<SongTitleProps> = ({ title, isVisible, isMuted }) => {
	const [opacity, setOpacity] = useState(0);
	const [scale, setScale] = useState(0.9);

	useEffect(() => {
		if (isVisible) {
			// Fade in and scale up
			const timeout = setTimeout(() => {
				setOpacity(1);
				setScale(1);
			}, 100);

			// Auto fade out after 3 seconds
			const hideTimeout = setTimeout(() => {
				setOpacity(0);
				setScale(0.9);
			}, 3000);

			return () => {
				clearTimeout(timeout);
				clearTimeout(hideTimeout);
			};
		}
	}, [isVisible]);

	return (
		<div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30">
			<div
				className="bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-xl px-8 py-4 rounded-2xl shadow-2xl border border-white/10 transition-all duration-500 ease-out"
				style={{
					opacity,
					transform: `scale(${scale}) translateY(${isVisible ? 0 : 20}px)`
				}}
			>
				<div className="text-center">
					<div className="text-white text-xl font-bold mb-2 tracking-wide">
						Now Playing
					</div>
					<div className="text-blue-300 text-lg font-medium mb-4">{title}</div>
					<div className="text-sm text-gray-300/80 flex items-center justify-center gap-3">
						<span className="flex items-center">
							<span className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
							{isMuted ? "Press P to unmute" : "Press P to mute"}
						</span>
						<span className="text-gray-500">•</span>
						<span className="flex items-center">
							<span className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
							Press N to skip
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SongTitle;
