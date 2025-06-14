import * as THREE from "three";
import type { Terrain } from "./Terrain";

class SandTrail {
	private mesh: THREE.Mesh;
	private lifetime: number;
	private currentTime: number;

	constructor(position: THREE.Vector3, size: number) {
		// Create a small plane for the trail
		const geometry = new THREE.PlaneGeometry(size, size);
		const material = new THREE.MeshStandardMaterial({
			color: 0xb8a898, // More sand-colored with grayish tint
			transparent: true,
			opacity: 0.2, // More transparent
			roughness: 0.9
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
		this.mesh.position.copy(position);
		this.mesh.position.y += 0.01; // Place just above the terrain

		this.lifetime = 5; // Trail lasts for 5 seconds
		this.currentTime = 0;
	}

	public update(delta: number): boolean {
		this.currentTime += delta;
		const progress = this.currentTime / this.lifetime;

		// Fade out the trail
		if (this.mesh.material instanceof THREE.MeshStandardMaterial) {
			this.mesh.material.opacity = 0.8 * (1 - progress);
		}

		// Return true if the trail should be removed
		return progress >= 1;
	}

	public getMesh(): THREE.Mesh {
		return this.mesh;
	}
}

export class SandTrailManager {
	private trails: SandTrail[] = [];
	private scene: THREE.Scene;
	private terrain: Terrain;
	private lastTrailPosition: THREE.Vector3 | null = null;
	private readonly minDistance = 0.5; // Minimum distance between trails

	constructor(scene: THREE.Scene, terrain: Terrain) {
		this.scene = scene;
		this.terrain = terrain;
	}

	public update(delta: number, playerPosition: THREE.Vector3): void {
		// Get the terrain height at the player's position
		const terrainHeight = this.terrain.getHeightAt(playerPosition.x, playerPosition.z);

		// Create a position at the terrain height
		const groundPosition = new THREE.Vector3(playerPosition.x, terrainHeight, playerPosition.z);

		// Check if we should create a new trail
		if (
			!this.lastTrailPosition ||
			this.lastTrailPosition.distanceTo(groundPosition) >= this.minDistance
		) {
			this.createTrail(groundPosition);
			this.lastTrailPosition = groundPosition.clone();
		}

		// Update and remove expired trails
		this.trails = this.trails.filter(trail => {
			const shouldRemove = trail.update(delta);
			if (shouldRemove) {
				this.scene.remove(trail.getMesh());
			}
			return !shouldRemove;
		});
	}

	private createTrail(position: THREE.Vector3): void {
		const trail = new SandTrail(position, 0.3); // 0.3 units wide trail
		this.scene.add(trail.getMesh());
		this.trails.push(trail);
	}

	public dispose(): void {
		// Remove all trails from the scene
		for (const trail of this.trails) {
			this.scene.remove(trail.getMesh());
		}
		this.trails = [];
	}
}
