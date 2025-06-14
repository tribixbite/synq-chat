import * as THREE from "three";

export class Clouds {
	private cloudGroup: THREE.Group;
	private clouds: THREE.Group[] = [];
	private windDirection: THREE.Vector3;
	private windSpeed: number;

	constructor() {
		this.cloudGroup = new THREE.Group();
		this.windDirection = new THREE.Vector3(1, 0, 0).normalize();
		this.windSpeed = 0.1;
		this.createClouds();
	}

	private createClouds(): void {
		const cloudCount = 15;
		const cloudSize = 5;
		const cloudHeight = 20;
		const cloudSpread = 100;

		for (let i = 0; i < cloudCount; i++) {
			// Create a cloud using multiple spheres
			const cloud = new THREE.Group();
			const numSpheres = Math.floor(Math.random() * 3) + 3;

			for (let j = 0; j < numSpheres; j++) {
				const size = cloudSize * (0.5 + Math.random() * 0.5);
				const geometry = new THREE.SphereGeometry(size, 8, 8);
				const material = new THREE.MeshStandardMaterial({
					color: 0xffffff,
					transparent: true,
					opacity: 0.8,
					roughness: 0.9,
					side: THREE.DoubleSide
				});

				const sphere = new THREE.Mesh(geometry, material);
				sphere.castShadow = false;
				sphere.receiveShadow = false;

				// Position spheres to create a cloud-like shape
				sphere.position.set(
					(Math.random() - 0.5) * size * 2,
					(Math.random() - 0.5) * size,
					(Math.random() - 0.5) * size * 2
				);

				cloud.add(sphere);
			}

			// Position the cloud in the sky
			cloud.position.set(
				(Math.random() - 0.5) * cloudSpread,
				cloudHeight + Math.random() * 10,
				(Math.random() - 0.5) * cloudSpread
			);

			this.cloudGroup.add(cloud);
			this.clouds.push(cloud);
		}
	}

	public update(deltaTime: number): void {
		// Move clouds with wind
		for (const cloud of this.clouds) {
			cloud.position.add(
				this.windDirection.clone().multiplyScalar(this.windSpeed * deltaTime)
			);

			// Wrap clouds around when they go too far
			if (cloud.position.x > 50) {
				cloud.position.x = -50;
			} else if (cloud.position.x < -50) {
				cloud.position.x = 50;
			}

			if (cloud.position.z > 50) {
				cloud.position.z = -50;
			} else if (cloud.position.z < -50) {
				cloud.position.z = 50;
			}
		}
	}

	public getCloudGroup(): THREE.Group {
		return this.cloudGroup;
	}
}
