// import React from "react";
// // import { Footer } from '@shared/components/Footer';

// const App = () => {
// 	return (
// 		<div className="app">
// 			<h1>Admin Panel</h1>
// 			<p>Welcome to the Admin application.</p>
// 			{/* <Footer appName="Admin Panel" /> */}
// 		</div>
// 	);
// };

// export default App;
import React, { useEffect, useRef, useState } from "react";
import {
	ReactTogether,
	useConnectedUsers,
	useCursors,
	useMyId,
	useNicknames,
	useStateTogetherWithPerUserValues
} from "react-together";
import * as THREE from "three";

interface PlayerPosition {
	x: number;
	y: number;
	z: number;
	rotationY: number;
}

interface OtherPlayer {
	mesh: THREE.Mesh;
	nameSprite: THREE.Sprite;
}

// This component handles the 3D scene and multiplayer integration
const MultiplayerBeach = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneManagerRef = useRef(null);
	const [isGuiVisible, setIsGuiVisible] = useState(true);
	const [currentSong, setCurrentSong] = useState("");
	const [showSongTitle, setShowSongTitle] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const myId = useMyId();
	const { allCursors } = useCursors();
	const [nickname, setNickname] = useNicknames();
	const connectedUsers = useConnectedUsers();

	// Using MultiSynq to share player positions
	const [myPosition, setMyPosition, allPositions] =
		useStateTogetherWithPerUserValues<PlayerPosition>(
			"player-positions",
			{ x: 0, y: 1.7, z: 0, rotationY: 0 },
			{ throttleDelay: 50 }
		);

	// Initialize the beach scene
	useEffect(() => {
		// Load Three.js script dynamically
		const threeScript = document.createElement("script");
		threeScript.src = "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js";
		threeScript.async = true;
		document.body.appendChild(threeScript);

		threeScript.onload = () => {
			if (!canvasRef.current) return;

			// Basic Three.js scene setup
			const scene = new THREE.Scene();
			scene.background = new THREE.Color(0x87ceeb);
			scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

			const camera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);

			const renderer = new THREE.WebGLRenderer({
				canvas: canvasRef.current,
				antialias: true
			});

			renderer.setSize(window.innerWidth, window.innerHeight);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.shadowMap.enabled = true;

			// Add basic lighting
			const ambientLight = new THREE.AmbientLight(0x4040ff, 0.8);
			const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
			directionalLight.position.set(10, 20, 10);
			directionalLight.castShadow = true;
			scene.add(ambientLight, directionalLight);

			// Create simple terrain
			const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 128, 128);
			terrainGeometry.rotateX(-Math.PI / 2);
			const terrainMaterial = new THREE.MeshStandardMaterial({
				color: 0xf4d03f,
				roughness: 0.8
			});
			const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
			terrain.receiveShadow = true;
			scene.add(terrain);

			// Create ocean
			const oceanGeometry = new THREE.PlaneGeometry(1000, 1000, 128, 128);
			oceanGeometry.rotateX(-Math.PI / 2);
			const oceanMaterial = new THREE.MeshStandardMaterial({
				color: 0x87ceeb,
				transparent: true,
				opacity: 0.8
			});
			const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
			ocean.position.y = 0.1;
			scene.add(ocean);

			// Create a simple representation for our player
			const playerGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
			const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x1e90ff });
			const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
			playerMesh.position.set(0, 1.7, 0);
			playerMesh.castShadow = true;
			scene.add(playerMesh);

			// Initialize camera position
			camera.position.set(0, 1.7 + 1, 0); // Slightly above player head

			// Other player representations
			const otherPlayers: Record<string, OtherPlayer> = {};

			// Initialize controls
			let moveForward = false;
			let moveBackward = false;
			let moveLeft = false;
			let moveRight = false;
			let canJump = true;

			const velocity = new THREE.Vector3();
			const direction = new THREE.Vector3();
			let verticalVelocity = 0;
			const movementSpeed = 5.0;
			const jumpHeight = 10.0;
			const gravity = 30.0;
			const playerHeight = 1.7;

			// Handle keyboard controls
			const onKeyDown = (event: KeyboardEvent) => {
				switch (event.code) {
					case "KeyW":
						moveForward = true;
						break;
					case "KeyS":
						moveBackward = true;
						break;
					case "KeyA":
						moveLeft = true;
						break;
					case "KeyD":
						moveRight = true;
						break;
					case "Space":
						if (canJump) {
							verticalVelocity = jumpHeight;
							canJump = false;
						}
						break;
					case "KeyH":
						setIsGuiVisible(prev => !prev);
						break;
				}
			};

			const onKeyUp = (event: KeyboardEvent) => {
				switch (event.code) {
					case "KeyW":
						moveForward = false;
						break;
					case "KeyS":
						moveBackward = false;
						break;
					case "KeyA":
						moveLeft = false;
						break;
					case "KeyD":
						moveRight = false;
						break;
				}
			};

			document.addEventListener("keydown", onKeyDown);
			document.addEventListener("keyup", onKeyUp);

			// Mouse controls for looking around
			let isPointerLocked = false;
			const euler = new THREE.Euler(0, 0, 0, "YXZ");
			const mouseSensitivity = 0.002;

			const onPointerLockChange = () => {
				isPointerLocked = document.pointerLockElement === canvasRef.current;
			};

			document.addEventListener("pointerlockchange", onPointerLockChange, false);

			if (canvasRef.current) {
				canvasRef.current.addEventListener("click", () => {
					if (!isPointerLocked && canvasRef.current) {
						canvasRef.current.requestPointerLock();
					}
				});
			}

			document.addEventListener("mousemove", (event: MouseEvent) => {
				if (isPointerLocked) {
					euler.setFromQuaternion(camera.quaternion);
					euler.y -= event.movementX * mouseSensitivity;
					euler.x -= event.movementY * mouseSensitivity;
					euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
					camera.quaternion.setFromEuler(euler);
					playerMesh.rotation.y = euler.y; // Rotate player model
				}
			});

			// Animation loop
			const clock = new THREE.Clock();

			const animate = () => {
				const deltaTime = clock.getDelta();

				// Only update if pointer is locked (active controls)
				if (isPointerLocked) {
					// Apply gravity
					if (playerMesh.position.y > playerHeight) {
						verticalVelocity -= gravity * deltaTime;
						playerMesh.position.y += verticalVelocity * deltaTime;
						canJump = false;
					} else {
						playerMesh.position.y = playerHeight;
						verticalVelocity = 0;
						canJump = true;
					}

					// Calculate movement direction
					direction.z = Number(moveForward) - Number(moveBackward);
					direction.x = Number(moveLeft) - Number(moveRight);
					direction.normalize();

					// Calculate movement speed
					velocity.z = direction.z * movementSpeed * deltaTime;
					velocity.x = direction.x * movementSpeed * deltaTime;

					// Get camera direction (for movement relative to look direction)
					const cameraDirection = new THREE.Vector3();
					camera.getWorldDirection(cameraDirection);
					cameraDirection.y = 0;
					cameraDirection.normalize();

					// Calculate right vector
					const right = new THREE.Vector3()
						.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection)
						.normalize();

					// Calculate movement vectors
					const moveX = velocity.x * right.x + velocity.z * cameraDirection.x;
					const moveZ = velocity.x * right.z + velocity.z * cameraDirection.z;

					// Apply movement
					playerMesh.position.x += moveX;
					playerMesh.position.z += moveZ;

					// Update camera position to follow player
					camera.position.x = playerMesh.position.x;
					camera.position.z = playerMesh.position.z;
					camera.position.y = playerMesh.position.y + 0.5; // Slightly above player head

					// Update player position in MultiSynq
					setMyPosition({
						x: playerMesh.position.x,
						y: playerMesh.position.y,
						z: playerMesh.position.z,
						rotationY: euler.y
					});
				}

				// Render other players from MultySynq
				for (const [userId, position] of Object.entries(allPositions)) {
					// Skip our own player
					if (userId === myId) continue;

					// Create or update other player representation
					if (!otherPlayers[userId]) {
						const otherPlayerGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
						// Generate a consistent color based on userId
						const hash = userId
							.split("")
							.reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
						const color = new THREE.Color(
							Math.sin(hash * 0.1) * 0.5 + 0.5,
							Math.sin(hash * 0.2) * 0.5 + 0.5,
							Math.sin(hash * 0.3) * 0.5 + 0.5
						);
						const otherPlayerMaterial = new THREE.MeshStandardMaterial({ color });
						const mesh = new THREE.Mesh(otherPlayerGeometry, otherPlayerMaterial);
						mesh.castShadow = true;
						scene.add(mesh);

						// Add a name tag (text sprite)
						const nameCanvas = document.createElement("canvas");
						const context = nameCanvas.getContext("2d");
						nameCanvas.width = 256;
						nameCanvas.height = 64;
						if (context) {
							context.font = "24px Arial";
							context.fillStyle = "white";
							context.textAlign = "center";
							context.fillText(
								connectedUsers.find(u => u.userId === userId)?.nickname || "Player",
								128,
								32
							);
						}

						const nameTexture = new THREE.CanvasTexture(nameCanvas);
						const nameSprite = new THREE.Sprite(
							new THREE.SpriteMaterial({ map: nameTexture, transparent: true })
						);
						nameSprite.position.y = 2.5; // Above the player
						nameSprite.scale.set(2, 0.5, 1);

						mesh.add(nameSprite);
						otherPlayers[userId] = { mesh, nameSprite };
					}

					// Update position and rotation
					otherPlayers[userId].mesh.position.set(position.x, position.y, position.z);
					otherPlayers[userId].mesh.rotation.y = position.rotationY;

					// Update name tag if nickname changed
					const currentName =
						connectedUsers.find(u => u.userId === userId)?.nickname || "Player";
					const nameSprite = otherPlayers[userId].nameSprite;
					const map = nameSprite.material.map;
					if (map?.image) {
						const nameCanvas = map.image as HTMLCanvasElement;
						const context = nameCanvas.getContext("2d");
						if (context) {
							context.clearRect(0, 0, nameCanvas.width, nameCanvas.height);
							context.font = "24px Arial";
							context.fillStyle = "white";
							context.textAlign = "center";
							context.fillText(currentName, 128, 32);
							map.needsUpdate = true;
						}
					}
				}

				// Remove disconnected players
				for (const userId of Object.keys(otherPlayers)) {
					if (!allPositions[userId]) {
						scene.remove(otherPlayers[userId].mesh);
						delete otherPlayers[userId];
					}
				}

				renderer.render(scene, camera);
				requestAnimationFrame(animate);
			};

			animate();

			// Handle window resize
			const handleResize = () => {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize(window.innerWidth, window.innerHeight);
			};

			window.addEventListener("resize", handleResize);

			// Cleanup on component unmount
			return () => {
				window.removeEventListener("resize", handleResize);
				document.removeEventListener("keydown", onKeyDown);
				document.removeEventListener("keyup", onKeyUp);
				document.removeEventListener("pointerlockchange", onPointerLockChange);
				document.body.removeChild(threeScript);
			};
		};

		return () => {
			if (document.body.contains(threeScript)) {
				document.body.removeChild(threeScript);
			}
		};
	}, [myId, setMyPosition, allPositions, connectedUsers]);

	// Render UI overlay
	return (
		<div className="fixed inset-0 bg-black">
			<canvas ref={canvasRef} className="w-full h-full block" />

			{/* Player list overlay */}
			{isGuiVisible && (
				<div className="absolute top-4 right-4 bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-2xl border border-white/10 text-white">
					<h3 className="text-lg font-bold mb-2">Players Online</h3>
					<ul>
						{connectedUsers.map(user => (
							<li key={user.userId} className="flex items-center gap-2 mb-1">
								<div
									className="w-3 h-3 rounded-full"
									style={{
										backgroundColor: getUserColor(user.userId)
									}}
								/>
								<span>
									{user.nickname} {user.isYou ? "(You)" : ""}
								</span>
							</li>
						))}
					</ul>

					{/* Nickname changer */}
					<div className="mt-4">
						<label className="block text-sm mb-1" htmlFor="nickname-input">
							Your Nickname:
						</label>
						<input
							id="nickname-input"
							type="text"
							value={nickname}
							onChange={e => setNickname(e.target.value)}
							className="bg-black/50 text-white px-2 py-1 rounded border border-white/20 w-full"
						/>
					</div>
				</div>
			)}

			{/* Controls help */}
			{isGuiVisible && (
				<div className="absolute bottom-4 left-4 text-white bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-2xl border border-white/10">
					<div className="text-sm">
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-blue-400 rounded-full" />
							<span>WASD to move, mouse to look around</span>
						</div>
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-purple-400 rounded-full" />
							<span>SPACE to jump</span>
						</div>
						<div className="flex items-center gap-2 mb-2">
							<span className="w-2 h-2 bg-pink-400 rounded-full" />
							<span>H to toggle interface</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 bg-yellow-400 rounded-full" />
							<span>ESC to release mouse</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

// Helper function to generate consistent colors from userIds
const getUserColor = (userId: string): string => {
	const hash = userId
		.split("")
		.reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
	const h = hash % 360;
	return `hsl(${h}, 70%, 50%)`;
};

// Main app with MultiSynq integration
const App = () => {
	return (
		<ReactTogether
			sessionParams={{
				appId: "io.multisynq.vibebeach",
				apiKey: "23sVEUaUxUZrMnRenGFo2pXvSn8gAVExzXvt3vPCZ9",
				name: "vibe-beach-party"
			}}
			rememberUsers={true}
		>
			<MultiplayerBeach />
		</ReactTogether>
	);
};

export default App;
