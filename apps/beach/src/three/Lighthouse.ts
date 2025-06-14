import * as THREE from "three";

export class Lighthouse {
	private mesh: THREE.Group;
	private scene: THREE.Scene;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.mesh = new THREE.Group();
		this.createLighthouse();
	}

	private createLighthouse(): void {
		// Main tower (reduced from 20 to 15 units tall)
		const towerGeometry = new THREE.CylinderGeometry(1.5, 2.25, 15, 8);
		const towerMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff, // White color
			roughness: 0.7,
			metalness: 0.3
		});
		const tower = new THREE.Mesh(towerGeometry, towerMaterial);
		tower.position.y = 7.5; // Half height
		tower.castShadow = true;
		tower.receiveShadow = true;
		this.mesh.add(tower);

		// Red stripes
		const stripeMaterial = new THREE.MeshStandardMaterial({
			color: 0xcc0000, // Red color
			roughness: 0.7,
			metalness: 0.3
		});

		// Create multiple stripes
		for (let i = 0; i < 3; i++) {
			const stripeGeometry = new THREE.CylinderGeometry(1.6, 2.35, 0.75, 8);
			const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
			stripe.position.y = 3.75 + i * 3.75; // Space stripes evenly
			this.mesh.add(stripe);
		}

		// Light room (reduced from 4 to 3 units radius)
		const lightRoomGeometry = new THREE.CylinderGeometry(3, 3, 2.25, 8);
		const lightRoomMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			roughness: 0.7,
			metalness: 0.3
		});
		const lightRoom = new THREE.Mesh(lightRoomGeometry, lightRoomMaterial);
		lightRoom.position.y = 15; // At the top of the tower
		lightRoom.castShadow = true;
		lightRoom.receiveShadow = true;
		this.mesh.add(lightRoom);

		// Windows in light room
		const windowGeometry = new THREE.PlaneGeometry(1.5, 1.125);
		const windowMaterial = new THREE.MeshStandardMaterial({
			color: 0x87ceeb, // Light blue
			roughness: 0.2,
			metalness: 0.8
		});

		// Add windows around the light room
		const windowCount = 8;
		const windowOutwardsOffset = 2.8;
		for (let i = 0; i < windowCount; i++) {
			const window = new THREE.Mesh(windowGeometry, windowMaterial);
			const angle = (i / windowCount) * Math.PI * 2 + Math.PI / 8;
			window.position.set(
				Math.cos(angle) * windowOutwardsOffset,
				15,
				Math.sin(angle) * windowOutwardsOffset
			);
			window.lookAt(0, 15, 0);

			// negate direction of the window
			window.rotateY(Math.PI);

			this.mesh.add(window);
		}

		// Roof (reduced from 5 to 3.75 units radius)
		const roofGeometry = new THREE.ConeGeometry(3.75, 3.25, 8);
		const roofMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333, // Dark gray
			roughness: 0.8,
			metalness: 0.2
		});
		const roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.y = 17.125; // On top of light room
		roof.castShadow = true;
		this.mesh.add(roof);

		// Base (reduced from 5-6 to 3.75-4.5 units radius)
		const baseGeometry = new THREE.CylinderGeometry(3.75, 4.5, 1.5, 8);
		const baseMaterial = new THREE.MeshStandardMaterial({
			color: 0x888888, // Gray
			roughness: 0.8,
			metalness: 0.2
		});
		const base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.y = 0.75; // Half height
		base.castShadow = true;
		base.receiveShadow = true;
		this.mesh.add(base);

		// Add to scene
		this.scene.add(this.mesh);
	}

	public getMesh(): THREE.Group {
		return this.mesh;
	}

	public setPosition(x: number, y: number, z: number): void {
		this.mesh.position.set(x, y, z);
	}

	public dispose(): void {
		this.scene.remove(this.mesh);
		this.mesh.traverse(object => {
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
