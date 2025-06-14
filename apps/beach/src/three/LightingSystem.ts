import * as THREE from "three";

export function createLights(): {
	ambientLight: THREE.AmbientLight;
	directionalLight: THREE.DirectionalLight;
	shadowLight: THREE.DirectionalLight;
} {
	// Create ambient light for general scene illumination
	const ambientLight = new THREE.AmbientLight(0x4040ff, 0.8);

	// Create directional light for shadows and directional illumination
	const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
	directionalLight.position.set(10, 20, 10);
	directionalLight.castShadow = true;

	// Configure shadow properties for better quality
	directionalLight.shadow.mapSize.width = 4096;
	directionalLight.shadow.mapSize.height = 4096;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 500;
	directionalLight.shadow.camera.left = -100;
	directionalLight.shadow.camera.right = 100;
	directionalLight.shadow.camera.top = 100;
	directionalLight.shadow.camera.bottom = -100;
	directionalLight.shadow.bias = -0.0001;
	directionalLight.shadow.normalBias = 0.01;
	directionalLight.shadow.radius = 2;

	// Configure shadow camera to look at the center of the scene
	directionalLight.target.position.set(0, 0, 0);
	directionalLight.target.updateMatrixWorld();

	const shadowLight = new THREE.DirectionalLight(0xffffff, 1.5);
	shadowLight.position.copy(directionalLight.position);
	shadowLight.castShadow = true;

	return { ambientLight, directionalLight, shadowLight };
}
