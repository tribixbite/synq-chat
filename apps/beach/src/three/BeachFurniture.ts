import seedrandom from "seedrandom";
import * as THREE from "three";
import type { Terrain } from "./Terrain";

export class BeachFurniture {
	private scene: THREE.Scene;
	private terrain: Terrain;
	private furnitureGroup: THREE.Group;
	private rng: seedrandom.PRNG;

	constructor(scene: THREE.Scene, terrain: Terrain) {
		this.scene = scene;
		this.terrain = terrain;
		this.furnitureGroup = new THREE.Group();
		this.scene.add(this.furnitureGroup);
		this.rng = seedrandom("beach-furniture-42");
	}

	public createBeachChair(position: THREE.Vector3, rotation = 0): void {
		const chairGroup = new THREE.Group();

		// Chair frame (using boxes for simplicity)
		const frameMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b4513, // Saddle brown
			roughness: 0.8,
			metalness: 0.2
		});

		// Seat frame
		const seatFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.8), frameMaterial);
		seatFrame.position.y = 0.3;
		chairGroup.add(seatFrame);

		// Back frame
		const backFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.8), frameMaterial);
		backFrame.position.set(0, 0.7, -0.7);
		backFrame.rotation.x = Math.PI / 4;
		chairGroup.add(backFrame);

		// Legs
		const legGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
		const legs = [
			new THREE.Vector3(-0.5, 0.15, 0.3),
			new THREE.Vector3(0.5, 0.15, 0.3),
			new THREE.Vector3(-0.5, 0.15, -0.3),
			new THREE.Vector3(0.5, 0.15, -0.3)
		];

		for (const legPos of legs) {
			const leg = new THREE.Mesh(legGeometry, frameMaterial);
			leg.position.copy(legPos);
			chairGroup.add(leg);
		}

		// Fabric
		const fabricMaterial = new THREE.MeshStandardMaterial({
			color: 0x1e90ff, // Dodger blue
			roughness: 0.9,
			metalness: 0.1
		});

		// Seat fabric
		const seatFabric = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), fabricMaterial);
		seatFabric.position.set(0, 0.38, 0);
		seatFabric.rotation.x = -Math.PI / 2;
		chairGroup.add(seatFabric);

		// Back fabric
		const backFabric = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), fabricMaterial);
		backFabric.position.set(0, 0.7, -0.6);
		backFabric.rotation.x = -Math.PI / 4;
		chairGroup.add(backFabric);

		// Position and rotate the chair
		chairGroup.position.copy(position);
		chairGroup.rotation.y = rotation;
		chairGroup.castShadow = true;
		chairGroup.receiveShadow = true;

		this.furnitureGroup.add(chairGroup);
	}

	public createUmbrella(position: THREE.Vector3, rotation = 0): void {
		const umbrellaGroup = new THREE.Group();

		// Pole
		const poleMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b4513, // Saddle brown
			roughness: 0.8,
			metalness: 0.2
		});

		const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), poleMaterial);
		pole.position.y = 1.25;
		umbrellaGroup.add(pole);

		// Canopy
		const canopyMaterial = new THREE.MeshStandardMaterial({
			color: 0xff0000, // Red
			roughness: 0.9,
			metalness: 0.1,
			side: THREE.DoubleSide
		});

		const canopyGeometry = new THREE.ConeGeometry(1.2, 1.0, 8);
		const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
		canopy.position.y = 2.5;
		canopy.rotation.x = 0;
		umbrellaGroup.add(canopy);

		// Position and rotate the umbrella
		umbrellaGroup.position.copy(position);
		umbrellaGroup.rotation.y = rotation;
		umbrellaGroup.castShadow = true;
		umbrellaGroup.receiveShadow = true;

		// Add random distance away from position
		const randomDistance = this.rng() * 0.5 + 0.3;
		const randomAngle = this.rng() * Math.PI * 2;
		const randomX = Math.cos(randomAngle) * randomDistance;
		const randomZ = Math.sin(randomAngle) * randomDistance;
		umbrellaGroup.position.x += randomX;
		umbrellaGroup.position.z += randomZ;

		this.furnitureGroup.add(umbrellaGroup);
	}

	public dispose(): void {
		this.scene.remove(this.furnitureGroup);
		this.furnitureGroup.traverse(object => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose();
				if (Array.isArray(object.material)) {
					for (const material of object.material) {
						material.dispose();
					}
				} else {
					object.material.dispose();
				}
			}
		});
	}
}
