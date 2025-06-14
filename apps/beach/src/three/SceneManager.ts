import * as THREE from "three";
import { BeachFurniture } from "./BeachFurniture";
import { Clouds } from "./Clouds";
import FirstPersonController from "./FirstPersonController";
import { Jukebox } from "./Jukebox";
import { Lighthouse } from "./Lighthouse";
import { createLights } from "./LightingSystem";
import { Ocean } from "./Ocean";
import { SandTrailManager } from "./SandTrailManager";
import { createSkybox } from "./Skybox";
import { Terrain } from "./Terrain";

// Define PlayerPosition interface (can be moved to a types.ts file later)
interface PlayerPosition {
	x: number;
	y: number;
	z: number;
	rotationY: number; // For character orientation
}

class SceneManager {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private clock: THREE.Clock;
	private terrain!: Terrain;
	private controller!: FirstPersonController;
	private sandTrailManager!: SandTrailManager;
	private ocean!: Ocean;
	private lighthouse!: Lighthouse;
	private clouds!: Clouds;
	private ambientLight!: THREE.AmbientLight;
	private directionalLight!: THREE.DirectionalLight;
	private shadowLight!: THREE.DirectionalLight;
	private timeOfDay = 12; // Default to noon
	private isWireframeMode = false;
	private animationFrameId: number | null = null;
	private readonly TERRAIN_BASE_HEIGHT = 1; // Base height for the terrain
	private beachFurniture!: BeachFurniture;
	private jukebox!: Jukebox;

	// MultiSynq integration properties
	private otherPlayers: Map<string, THREE.Mesh> = new Map();
	private playerNameToTexture: Record<string, THREE.CanvasTexture> = {};

	constructor() {
		// Initialize scene
		this.scene = new THREE.Scene();
		this.scene.background = createSkybox();
		this.scene.environment = this.scene.background; // Use skybox as environment map for reflections

		// Add fog to the scene
		this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.01); // Light blue fog with medium density

		// Initialize camera
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.position.set(0, 1.7, 0); // Set camera at human eye level

		// Initialize renderer
		const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		// Enable shadows
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.shadowMap.autoUpdate = true;

		// Initialize clock for frame-independent movement
		this.clock = new THREE.Clock();

		// Create scene elements
		this.initScene();

		// Initialize controller
		this.controller = new FirstPersonController(
			this.camera,
			this.scene,
			this.terrain,
			this,
			this.jukebox
		);

		// Load saved position
		this.controller.loadPosition();

		// Initialize sand trail manager
		this.sandTrailManager = new SandTrailManager(this.scene, this.terrain);

		// Initialize ocean
		this.ocean = new Ocean();
		this.scene.add(this.ocean.getMesh());

		// Start animation loop
		this.animate();

		// Set up periodic position saving
		this.setupPositionSaving();
	}

	public getPlayerTransform(): PlayerPosition | null {
		if (!this.controller) return null;

		const position = this.controller.getPosition();
		const rotationY = this.controller.getRotationY();

		if (!position || typeof rotationY !== "number") return null;

		return {
			x: position.x,
			y: position.y,
			z: position.z,
			rotationY: rotationY
		};
	}

	public updateRemotePlayerVisuals(
		remotePlayerPositions: Record<string, PlayerPosition>,
		allNicknames: Record<string, string>
	): void {
		const activePlayerIds = new Set(Object.keys(remotePlayerPositions));

		for (const playerId in remotePlayerPositions) {
			const posData = remotePlayerPositions[playerId];
			if (!posData) continue;

			let playerMesh = this.otherPlayers.get(playerId);
			let nameTexture = this.playerNameToTexture[playerId];

			if (!playerMesh) {
				const playerGeometry = new THREE.CapsuleGeometry(0.4, 0.8, 4, 8);
				const hash = playerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
				const color = new THREE.Color(
					Math.sin(hash * 0.123 + 0.5) * 0.4 + 0.3,
					Math.sin(hash * 0.234 + 1.0) * 0.4 + 0.3,
					Math.sin(hash * 0.345 + 1.5) * 0.4 + 0.3
				);
				const playerMaterial = new THREE.MeshStandardMaterial({
					color,
					roughness: 0.7,
					metalness: 0.1
				});
				playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
				playerMesh.castShadow = true;
				playerMesh.receiveShadow = true;

				const nameCanvas = document.createElement("canvas");
				nameCanvas.width = 256;
				nameCanvas.height = 64;
				const context = nameCanvas.getContext("2d");
				if (context) {
					context.font = "bold 24px Arial";
					context.fillStyle = "rgba(255, 255, 255, 0.9)";
					context.textAlign = "center";
					context.textBaseline = "middle";
					context.fillText(
						allNicknames[playerId] || playerId.substring(0, 6),
						nameCanvas.width / 2,
						nameCanvas.height / 2
					);
				}

				nameTexture = new THREE.CanvasTexture(nameCanvas);
				nameTexture.needsUpdate = true;
				this.playerNameToTexture[playerId] = nameTexture; // Store for disposal

				const nameSpriteMaterial = new THREE.SpriteMaterial({
					map: nameTexture,
					transparent: true,
					alphaTest: 0.1
				});
				const nameSprite = new THREE.Sprite(nameSpriteMaterial);
				nameSprite.position.set(0, 1.0, 0);
				nameSprite.scale.set(1.5, 0.375, 1);
				nameSprite.name = "nicknameSprite"; // For easier lookup
				playerMesh.add(nameSprite);

				this.scene.add(playerMesh);
				this.otherPlayers.set(playerId, playerMesh);
			} else {
				// Update nickname if it changed (or ensure it exists)
				const currentNickname = allNicknames[playerId] || playerId.substring(0, 6);
				const sprite = playerMesh.getObjectByName("nicknameSprite") as THREE.Sprite;
				if (sprite && nameTexture && sprite.userData.currentNickname !== currentNickname) {
					const context = (nameTexture.image as HTMLCanvasElement).getContext("2d");
					if (context) {
						context.clearRect(0, 0, nameTexture.image.width, nameTexture.image.height);
						context.font = "bold 24px Arial";
						context.fillStyle = "rgba(255, 255, 255, 0.9)";
						context.textAlign = "center";
						context.textBaseline = "middle";
						context.fillText(
							currentNickname,
							nameTexture.image.width / 2,
							nameTexture.image.height / 2
						);
						nameTexture.needsUpdate = true;
						sprite.userData.currentNickname = currentNickname;
					}
				}
			}

			// Store target for lerping in animate loop
			playerMesh.userData.targetPosition = new THREE.Vector3(posData.x, posData.y, posData.z);
			playerMesh.userData.targetQuaternion = new THREE.Quaternion().setFromEuler(
				new THREE.Euler(0, posData.rotationY, 0, "YXZ")
			);
		}

		// Remove players that are no longer in remotePlayerPositions
		for (const [playerId, mesh] of this.otherPlayers) {
			if (!activePlayerIds.has(playerId)) {
				this.scene.remove(mesh);
				if (mesh.geometry) mesh.geometry.dispose();
				if (mesh.material instanceof THREE.Material) {
					mesh.material.dispose();
				} else if (Array.isArray(mesh.material)) {
					for (const m of mesh.material) {
						m.dispose();
					}
				}
				const nameSprite = mesh.children.find(child => child instanceof THREE.Sprite) as
					| THREE.Sprite
					| undefined;
				if (nameSprite) {
					const spriteMaterial = nameSprite.material as THREE.SpriteMaterial;
					if (spriteMaterial.map) spriteMaterial.map.dispose();
					spriteMaterial.dispose();
				}
				this.otherPlayers.delete(playerId);
				const textureToDispose = this.playerNameToTexture[playerId];
				if (textureToDispose) {
					textureToDispose.dispose();
					delete this.playerNameToTexture[playerId];
				}
			}
		}
	}

	private initScene(): void {
		const { ambientLight, directionalLight, shadowLight } = createLights();
		this.ambientLight = ambientLight;
		this.directionalLight = directionalLight;
		this.shadowLight = shadowLight;
		this.scene.add(this.ambientLight, this.directionalLight, this.shadowLight);

		this.terrain = new Terrain(this.scene, this.camera, this.TERRAIN_BASE_HEIGHT);
		this.lighthouse = new Lighthouse(this.scene);
		this.clouds = new Clouds();
		this.scene.add(this.clouds.getCloudGroup());
		this.beachFurniture = new BeachFurniture(this.scene, this.terrain);
		this.jukebox = new Jukebox(this.scene, this.terrain);
		this.jukebox.setAudioListener(this.camera);

		if (this.scene.fog) {
			this.terrain.updateUniforms(
				this.directionalLight.position,
				this.scene.fog.color,
				this.scene.fog instanceof THREE.FogExp2 ? this.scene.fog.density : 0.01
			);
		}
	}

	public toggleWireframeMode(): void {
		this.isWireframeMode = !this.isWireframeMode;

		// Apply wireframe mode to all objects in the scene
		this.scene.traverse(object => {
			if (object instanceof THREE.Mesh) {
				if (Array.isArray(object.material)) {
					for (const material of object.material) {
						if (
							material instanceof THREE.MeshStandardMaterial ||
							material instanceof THREE.MeshBasicMaterial ||
							material instanceof THREE.ShaderMaterial
						) {
							material.wireframe = this.isWireframeMode;
						}
					}
				} else if (
					object.material instanceof THREE.MeshStandardMaterial ||
					object.material instanceof THREE.MeshBasicMaterial ||
					object.material instanceof THREE.ShaderMaterial
				) {
					(
						object.material as
							| THREE.MeshStandardMaterial
							| THREE.MeshBasicMaterial
							| THREE.ShaderMaterial
					).wireframe = this.isWireframeMode;
				}
			}
		});
		// Also toggle for terrain chunks if they have a separate wireframe mechanism
		if (this.terrain && typeof (this.terrain as Terrain).setWireframeMode === "function") {
			(this.terrain as Terrain).setWireframeMode(this.isWireframeMode);
		}
	}

	public setTimeOfDay(time: number): void {
		this.timeOfDay = Math.max(0, Math.min(24, time)); // Clamp time between 0 and 24

		// Calculate sun position (simplified)
		const angle = ((this.timeOfDay - 6) / 12) * Math.PI * 2; // 6 AM sunrise, 6 PM sunset
		this.directionalLight.position.set(Math.cos(angle) * 100, Math.sin(angle) * 100, 50);
		this.shadowLight.position.copy(this.directionalLight.position);

		// Update light intensity and color based on time (example)
		if (this.timeOfDay < 5 || this.timeOfDay > 19) {
			// Night
			this.ambientLight.intensity = 0.1;
			this.directionalLight.intensity = 0.05;
			if (this.scene.fog) this.scene.fog.color.set(0x000033); // Dark blue fog for night
		} else if (this.timeOfDay < 7 || this.timeOfDay > 17) {
			// Dawn/Dusk
			this.ambientLight.intensity = 0.3;
			this.directionalLight.intensity = 0.5;
			this.directionalLight.color.set(0xffaa55); // Warm color for dawn/dusk
			if (this.scene.fog) this.scene.fog.color.set(0xffddaa); // Orange-ish fog
		} else {
			// Daytime
			this.ambientLight.intensity = 0.5;
			this.directionalLight.intensity = 1.0;
			this.directionalLight.color.set(0xffffff); // White light for daytime
			if (this.scene.fog) this.scene.fog.color.set(0x87ceeb); // Default sky blue fog
		}
		// Update terrain uniforms if it depends on lighting conditions
		if (this.terrain && this.scene.fog) {
			this.terrain.updateUniforms(
				this.directionalLight.position,
				this.scene.fog.color,
				this.scene.fog instanceof THREE.FogExp2 ? this.scene.fog.density : 0.01
			);
		}
	}

	public setFogDensity(density: number): void {
		if (this.scene.fog instanceof THREE.FogExp2) {
			this.scene.fog.density = density;
		}
		if (this.terrain && this.scene.fog) {
			this.terrain.updateUniforms(
				this.directionalLight.position,
				this.scene.fog.color,
				this.scene.fog instanceof THREE.FogExp2 ? this.scene.fog.density : 0.01
			);
		}
	}

	public getJukebox(): Jukebox | undefined {
		return this.jukebox;
	}

	public getWorldDimensions(): {
		width: number;
		depth: number;
		heightScale: number; // This remains a bit arbitrary for now
	} | null {
		if (this.terrain) {
			const chunkSize = this.terrain.getChunkSize();
			const viewDistance = this.terrain.getViewDistance();
			const totalDimension = (2 * viewDistance + 1) * chunkSize;
			return {
				width: totalDimension,
				depth: totalDimension,
				heightScale: 50 // Placeholder: Max terrain height for minimap scaling. Adjust as needed.
			};
		}
		console.warn("SceneManager.getWorldDimensions(): Terrain not available, using default.");
		return {
			width: 500,
			depth: 500,
			heightScale: 50
		};
	}

	private animate = (): void => {
		this.animationFrameId = requestAnimationFrame(this.animate);
		const delta = this.clock.getDelta();

		this.controller.update(delta);
		if (this.sandTrailManager && this.controller) {
			const playerPos = this.controller.getPosition();
			if (playerPos) this.sandTrailManager.update(delta, playerPos);
		}
		this.ocean.update(delta);
		this.clouds.update(delta);
		this.terrain.update(delta);

		// Lerp remote player positions
		if (this.otherPlayers && this.otherPlayers.size > 0) {
			for (const [_playerId, playerMesh] of this.otherPlayers) {
				if (playerMesh.userData.targetPosition && playerMesh.userData.targetQuaternion) {
					playerMesh.position.lerp(playerMesh.userData.targetPosition, 0.1);
					playerMesh.quaternion.slerp(playerMesh.userData.targetQuaternion, 0.1);

					const nicknameSprite = playerMesh.getObjectByName("nicknameSprite");
					if (nicknameSprite) {
						nicknameSprite.position
							.copy(playerMesh.position)
							.add(new THREE.Vector3(0, 1.0, 0));
					}
				}
			}
		}

		// Render scene
		this.renderer.render(this.scene, this.camera);
	};

	public onWindowResize(): void {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	public resetCamera(): void {
		this.controller.resetPosition();
	}

	public dispose(): void {
		if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);

		this.scene.traverse(object => {
			if (object instanceof THREE.Mesh) {
				if (object.geometry) object.geometry.dispose();
				if (object.material) {
					if (Array.isArray(object.material)) {
						for (const material of object.material) material.dispose();
					} else {
						(object.material as THREE.Material).dispose();
					}
				}
			}
		});

		if (this.scene.background && (this.scene.background as THREE.Texture).dispose) {
			(this.scene.background as THREE.Texture).dispose();
		}
		if (this.scene.environment && (this.scene.environment as THREE.Texture).dispose) {
			(this.scene.environment as THREE.Texture).dispose();
		}

		this.terrain?.dispose();
		this.ocean?.dispose();
		this.lighthouse?.dispose();
		this.beachFurniture?.dispose();
		this.jukebox?.dispose();
		this.sandTrailManager?.dispose();
		this.controller?.dispose();

		for (const playerMesh of this.otherPlayers.values()) {
			const nicknameSprite = playerMesh.getObjectByName("nicknameSprite") as THREE.Sprite;
			if (nicknameSprite?.material?.map) {
				(nicknameSprite.material.map as THREE.Texture).dispose();
			}
			nicknameSprite?.material?.dispose();
		}
		this.otherPlayers.clear();

		for (const texture of Object.values(this.playerNameToTexture)) texture.dispose();
		this.playerNameToTexture = {};

		this.renderer.dispose();
	}

	private setupPositionSaving(): void {
		setInterval(() => {
			this.controller.savePosition();
		}, 5000);
	}
}

export default SceneManager;
