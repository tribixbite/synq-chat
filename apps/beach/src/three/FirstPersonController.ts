import * as THREE from "three";
import type { Jukebox } from "./Jukebox";
import type SceneManager from "./SceneManager";
import type { Terrain } from "./Terrain";

class FirstPersonController {
	private camera: THREE.PerspectiveCamera;
	private scene: THREE.Scene;
	private terrain: Terrain;
	private sceneManager: SceneManager;
	private jukebox: Jukebox;
	private canvas: HTMLCanvasElement;

	// Movement state
	private moveForward = false;
	private moveBackward = false;
	private moveLeft = false;
	private moveRight = false;
	private moveUp = false;
	private moveDown = false;
	private canJump = true;
	private isFlyMode = false;

	// Physics
	private velocity = new THREE.Vector3();
	private direction = new THREE.Vector3();
	private verticalVelocity = 0;

	// Controller settings
	private readonly movementSpeed = 5.0;
	private readonly jumpHeight = 10.0;
	private readonly gravity = 30.0;
	private readonly flySpeed = 5.0;

	// Mouse control
	private isPointerLocked = false;
	private euler = new THREE.Euler(0, 0, 0, "YXZ");
	private mouseSensitivity = 0.002;

	// Player height
	private readonly playerHeight = 1.7;

	constructor(
		camera: THREE.PerspectiveCamera,
		scene: THREE.Scene,
		terrain: Terrain,
		sceneManager: SceneManager,
		jukebox: Jukebox
	) {
		this.camera = camera;
		this.scene = scene;
		this.terrain = terrain;
		this.sceneManager = sceneManager;
		this.jukebox = jukebox;
		this.canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;

		// Set initial random position
		const x = (Math.random() - 0.5) * 100; // Random x between -50 and 50
		const z = (Math.random() - 0.5) * 100; // Random z between -50 and 50
		const y = this.terrain.getHeightAt(x, z) + this.playerHeight;
		this.camera.position.set(x, y, z);

		// Calculate direction to center of island (0,0)
		const directionToCenter = new THREE.Vector3(x, 0, z).normalize();

		// Calculate the y-rotation (around Y axis) to look at center
		const yRotation = Math.atan2(directionToCenter.x, directionToCenter.z);

		// Set the camera rotation to look at center
		this.euler.set(0, yRotation, 0);
		this.camera.quaternion.setFromEuler(this.euler);

		this.initPointerLock();
		this.initKeyboardControls();
	}

	// Event Handlers defined as arrow functions to preserve 'this' context
	private onPointerLockChange = (): void => {
		this.isPointerLocked = document.pointerLockElement === this.canvas;
	};

	private onPointerLockError = (): void => {
		console.error("Pointer lock error");
	};

	private onCanvasClick = (): void => {
		if (!this.isPointerLocked) {
			this.canvas.requestPointerLock();
		}
	};

	private onMouseMove = (event: MouseEvent): void => {
		if (this.isPointerLocked) {
			this.euler.setFromQuaternion(this.camera.quaternion);
			this.euler.y -= event.movementX * this.mouseSensitivity;
			this.euler.x -= event.movementY * this.mouseSensitivity;
			this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
			this.camera.quaternion.setFromEuler(this.euler);
		}
	};

	private onKeyDown = (event: KeyboardEvent): void => {
		switch (event.code) {
			case "KeyW":
				this.moveForward = true;
				break;
			case "KeyS":
				this.moveBackward = true;
				break;
			case "KeyA":
				this.moveLeft = true;
				break;
			case "KeyD":
				this.moveRight = true;
				break;
			case "KeyQ":
				if (this.isFlyMode) this.moveDown = true;
				break;
			case "KeyE":
				if (this.isFlyMode) this.moveUp = true;
				break;
			case "Space":
				if (this.canJump && !this.isFlyMode) {
					this.verticalVelocity = this.jumpHeight;
					this.camera.position.y += 0.1;
					this.canJump = false;
				}
				break;
			case "KeyF":
				this.isFlyMode = !this.isFlyMode;
				if (this.isFlyMode) {
					this.verticalVelocity = 0;
					this.canJump = false;
				} else {
					this.moveUp = false;
					this.moveDown = false;
				}
				break;
			case "KeyT":
				this.sceneManager.toggleWireframeMode();
				break;
			case "KeyN":
				// Next song from anywhere
				this.jukebox.nextSong();
				break;
		}
	};

	private onKeyUp = (event: KeyboardEvent): void => {
		switch (event.code) {
			case "KeyW":
				this.moveForward = false;
				break;
			case "KeyS":
				this.moveBackward = false;
				break;
			case "KeyA":
				this.moveLeft = false;
				break;
			case "KeyD":
				this.moveRight = false;
				break;
			case "KeyQ":
				this.moveDown = false;
				break;
			case "KeyE":
				this.moveUp = false;
				break;
		}
	};

	private initPointerLock(): void {
		document.addEventListener("pointerlockchange", this.onPointerLockChange, false);
		document.addEventListener("pointerlockerror", this.onPointerLockError, false);
		this.canvas.addEventListener("click", this.onCanvasClick);
		document.addEventListener("mousemove", this.onMouseMove);
	}

	private initKeyboardControls(): void {
		document.addEventListener("keydown", this.onKeyDown);
		document.addEventListener("keyup", this.onKeyUp);
	}

	public update(delta: number): void {
		// Only update if pointer is locked
		if (!this.isPointerLocked) return;

		if (!this.isFlyMode) {
			// Get terrain height at current position
			const terrainHeight = this.terrain.getHeightAt(
				this.camera.position.x,
				this.camera.position.z
			);

			// Check if player is above terrain
			if (this.camera.position.y > terrainHeight + this.playerHeight) {
				// Player is in the air, apply gravity
				this.verticalVelocity -= this.gravity * delta;
				this.camera.position.y += this.verticalVelocity * delta;
				this.canJump = false;
			} else {
				// Player is on or below terrain
				this.camera.position.y = terrainHeight + this.playerHeight;
				this.verticalVelocity = 0;
				this.canJump = true;
			}
		} else {
			// Handle vertical movement in fly mode
			const verticalMove =
				(Number(this.moveUp) - Number(this.moveDown)) * this.flySpeed * delta;
			this.camera.position.y += verticalMove;
		}

		// Calculate horizontal movement direction
		this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
		this.direction.x = Number(this.moveLeft) - Number(this.moveRight);
		this.direction.normalize();

		// Update velocity based on direction
		this.velocity.z = this.direction.z * this.movementSpeed * delta;
		this.velocity.x = this.direction.x * this.movementSpeed * delta;

		// Convert movement to camera direction
		const cameraDirection = new THREE.Vector3();
		this.camera.getWorldDirection(cameraDirection);
		cameraDirection.y = 0;
		cameraDirection.normalize();

		// Calculate forward and right vectors
		const right = new THREE.Vector3()
			.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection)
			.normalize();

		// Apply movement in camera direction
		const moveX = this.velocity.x * right.x + this.velocity.z * cameraDirection.x;
		const moveZ = this.velocity.x * right.z + this.velocity.z * cameraDirection.z;

		// Move camera horizontally
		this.camera.position.x += moveX;
		this.camera.position.z += moveZ;
	}

	public dispose(): void {
		// Clean up event listeners
		document.removeEventListener("pointerlockchange", this.onPointerLockChange);
		document.removeEventListener("pointerlockerror", this.onPointerLockError);
		this.canvas.removeEventListener("click", this.onCanvasClick);
		document.removeEventListener("mousemove", this.onMouseMove);
		document.removeEventListener("keydown", this.onKeyDown);
		document.removeEventListener("keyup", this.onKeyUp);

		if (document.pointerLockElement === this.canvas) {
			document.exitPointerLock();
		}
	}

	public savePosition(): void {
		// No longer saving position to localStorage
	}

	public loadPosition(): void {
		// No longer loading position from localStorage
	}

	public resetPosition(): void {
		// Generate random x,z coordinates within a reasonable range
		const x = (Math.random() - 0.5) * 100; // Random x between -50 and 50
		const z = (Math.random() - 0.5) * 100; // Random z between -50 and 50

		// Get the height at this position from the terrain
		const y = this.terrain.getHeightAt(x, z) + this.playerHeight;

		// Set the camera position
		this.camera.position.set(x, y, z);

		// Reset rotation
		this.camera.rotation.set(0, 0, 0);
		this.euler.set(0, 0, 0);
		this.camera.quaternion.setFromEuler(this.euler);
		this.verticalVelocity = 0;
	}

	// Method to get current player position
	public getPosition(): THREE.Vector3 {
		return this.camera.position.clone();
	}

	// Method to get current player Y rotation (from the Euler angle)
	public getRotationY(): number {
		return this.euler.y;
	}
}

export default FirstPersonController;
