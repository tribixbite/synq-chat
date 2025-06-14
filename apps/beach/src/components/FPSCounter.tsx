import type React from "react";
import { useEffect, useState, useRef } from "react";

const FPSCounter: React.FC = () => {
	const [fps, setFps] = useState(0);
	const frameCount = useRef(0);
	const lastTime = useRef(performance.now());
	const animationFrameId = useRef<number>();

	useEffect(() => {
		const updateFPS = () => {
			const currentTime = performance.now();
			frameCount.current++;

			if (currentTime - lastTime.current >= 1000) {
				setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
				frameCount.current = 0;
				lastTime.current = currentTime;
			}

			animationFrameId.current = requestAnimationFrame(updateFPS);
		};

		animationFrameId.current = requestAnimationFrame(updateFPS);

		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, []);

	return (
		<div className="absolute top-4 left-4 text-white bg-black/50 px-3 py-1 rounded text-sm">
			FPS: {fps}
		</div>
	);
};

export default FPSCounter;
