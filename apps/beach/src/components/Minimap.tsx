import type { FC } from "react";

interface PlayerPosition {
	x: number;
	y: number;
	z: number;
	rotationY: number;
}

interface MinimapProps {
	allPlayerPositions: Record<string, PlayerPosition | null>;
	myId: string | null;
	allNicknames: Record<string, string>;
	worldSize?: { width: number; depth: number }; // e.g., width and depth of the terrain
	minimapSize?: { width: number; height: number };
}

const DEFAULT_WORLD_SIZE = { width: 500, depth: 500 }; // Example, adjust to your world
const DEFAULT_MINIMAP_SIZE = { width: 150, height: 150 }; // px

const Minimap: FC<MinimapProps> = ({
	allPlayerPositions,
	myId,
	allNicknames,
	worldSize = DEFAULT_WORLD_SIZE,
	minimapSize = DEFAULT_MINIMAP_SIZE
}) => {
	const getMinimapPosition = (worldX: number, worldZ: number) => {
		// Center the world coordinates around 0,0 for mapping
		const normalizedX = worldX / worldSize.width + 0.5;
		const normalizedZ = worldZ / worldSize.depth + 0.5;

		return {
			left: `${Math.max(0, Math.min(1, normalizedX)) * 100}%`,
			top: `${Math.max(0, Math.min(1, normalizedZ)) * 100}%`
		};
	};

	return (
		<div
			className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl overflow-hidden"
			style={{
				width: `${minimapSize.width}px`,
				height: `${minimapSize.height}px`
			}}
		>
			{Object.entries(allPlayerPositions).map(([userId, position]) => {
				if (!position) return null;

				const { left, top } = getMinimapPosition(position.x, position.z);
				const isMe = userId === myId;
				const nickname = allNicknames[userId] || userId.substring(0, 6);
				const color = isMe ? "bg-blue-400" : "bg-red-400";

				return (
					<div
						key={userId}
						className={`absolute w-3 h-3 ${color} rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md`}
						style={{ left, top }}
						title={`${nickname} (X: ${position.x.toFixed(0)}, Z: ${position.z.toFixed(0)})`}
					>
						{isMe && (
							<div className="w-full h-full rounded-full border-2 border-white animate-ping-slow opacity-75" />
						)}
					</div>
				);
			})}
			{/* Optional: Add a marker for the center of the map or other landmarks */}
			{/* <div 
        className="absolute w-1 h-1 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: '50%', top: '50%' }}
        title="Center"
      /> */}
		</div>
	);
};

export default Minimap;
