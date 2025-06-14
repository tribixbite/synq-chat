import * as THREE from "three";

class TerrainChunk {
	private mesh: THREE.Mesh;
	private uniforms: {
		time: { value: number };
		sandColor: { value: THREE.Color };
		sandColor2: { value: THREE.Color };
		sandColor3: { value: THREE.Color };
		sandColor4: { value: THREE.Color };
		sandTexture: { value: THREE.Texture };
		lightDirection: { value: THREE.Vector3 };
		fogColor: { value: THREE.Color };
		fogDensity: { value: number };
	};
	private position: THREE.Vector2;
	private size: number;
	private currentLOD: number;
	private geometries: THREE.BufferGeometry[];
	private static readonly LOD_LEVELS = [
		{ resolution: 64, distance: 0 }, // Low detail
		{ resolution: 32, distance: 24 } // Very low detail
	];
	private lastUpdateTime = 0;
	private updateInterval = 0;
	private baseHeight: number;

	constructor(
		position: THREE.Vector2,
		size: number,
		sandTexture: THREE.Texture,
		baseHeight: number
	) {
		this.position = position;
		this.size = size;
		this.currentLOD = 0;
		this.baseHeight = baseHeight;

		// Create geometries for all LOD levels
		this.geometries = TerrainChunk.LOD_LEVELS.map(level => {
			const geometry = new THREE.PlaneGeometry(
				size,
				size,
				level.resolution,
				level.resolution
			);
			geometry.rotateX(-Math.PI / 2);

			// Get the position attribute
			const positions = geometry.attributes.position;
			const vertices = positions.array;
			const vertexCount = vertices.length / 3;

			// Calculate heights for each vertex
			for (let i = 0; i < vertexCount; i++) {
				const x = vertices[i * 3];
				const z = vertices[i * 3 + 2];

				// Calculate world position
				const worldX = x + position.x;
				const worldZ = z + position.y;

				// Calculate distance from center
				const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
				const islandRadius = 40.0;

				// Generate height using multiple octaves of noise
				const noiseScale = 0.005;
				const heightScale = 12.0;
				const noiseStrength = 0.4;

				const noisePos = new THREE.Vector2(worldX, worldZ).multiplyScalar(noiseScale);
				let height = this.fbm(noisePos) * heightScale * noiseStrength;

				// Add gentler variation based on position
				height += Math.sin(worldX * 0.03) * Math.cos(worldZ * 0.03) * 0.05;

				// Create a more pronounced island shape
				const beachRadius = 45.0; // Added transition zone
				const beachHeight = -1.5; // Slightly higher beach
				const centerHeight = 4.0; // Slightly lower center elevation

				// Create smoother transitions
				const islandFactor = this.smoothstep(islandRadius, beachRadius, distFromCenter);
				const centerFactor = 1.0 - this.smoothstep(0.0, islandRadius * 0.7, distFromCenter); // Wider center influence

				// Add central elevation with smoother transition
				height += centerFactor * centerHeight;

				// Create gradual slope towards the ocean with smoother transition
				height = this.mix(height, beachHeight, islandFactor);

				// Apply height to vertex
				vertices[i * 3 + 1] = height + baseHeight;
			}

			// Recalculate normals after modifying vertices
			geometry.computeVertexNormals();

			return geometry;
		});

		// Create shader uniforms
		this.uniforms = {
			time: { value: 0 },
			sandColor: { value: new THREE.Color(0xf4d03f) },
			sandColor2: { value: new THREE.Color(0xf1c40f) },
			sandColor3: { value: new THREE.Color(0xf39c12) },
			sandColor4: { value: new THREE.Color(0xe67e22) },
			sandTexture: { value: sandTexture },
			lightDirection: { value: new THREE.Vector3(1, 1, 1) },
			fogColor: { value: new THREE.Color(0x87ceeb) },
			fogDensity: { value: 0.01 }
		};

		// Create shader material
		const material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vFogDepth;
        
        void main() {
          vNormal = normal;
          vPosition = position;
          vUv = uv * 10.1;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vFogDepth = -mvPosition.z;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
			fragmentShader: `
        uniform sampler2D sandTexture;
        uniform vec3 lightDirection;
        uniform vec3 fogColor;
        uniform float fogDensity;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vFogDepth;
        
        void main() {
          vec4 sandColor = texture2D(sandTexture, vUv);
          
          // Enhanced lighting
          float diffuse = max(0.0, dot(vNormal, normalize(lightDirection)));
          vec3 color = sandColor.rgb * (diffuse * 0.8 + 0.5);
          
          // Add some specular highlights
          vec3 viewDir = normalize(-vPosition);
          vec3 reflectDir = reflect(-normalize(lightDirection), vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          color += spec * 0.15;
          
          // Apply fog
          float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          color = mix(color, fogColor, fogFactor);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
		});

		// Create mesh
		this.mesh = new THREE.Mesh(this.geometries[0], material);
		this.mesh.position.set(position.x, 0, position.y);
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = false;

		// Remove custom depth material since we're not using shadows
		this.mesh.customDepthMaterial = undefined;
	}

	public updateLOD(cameraPosition: THREE.Vector3): void {
		const distance = new THREE.Vector2(
			cameraPosition.x - this.position.x,
			cameraPosition.z - this.position.y
		).length();

		// Find appropriate LOD level based on distance
		let newLOD = 0;
		for (let i = 0; i < TerrainChunk.LOD_LEVELS.length; i++) {
			if (distance >= TerrainChunk.LOD_LEVELS[i].distance) {
				newLOD = i;
			} else {
				break;
			}
		}

		// Update geometry if LOD changed
		if (newLOD !== this.currentLOD) {
			this.mesh.geometry = this.geometries[newLOD];
			this.currentLOD = newLOD;
		}

		// Set update interval based on distance
		this.updateInterval = Math.max(0.1, distance * 0.01);
	}

	public shouldUpdate(currentTime: number): boolean {
		return currentTime - this.lastUpdateTime >= this.updateInterval;
	}

	public update(delta: number, currentTime: number): void {
		if (this.shouldUpdate(currentTime)) {
			this.uniforms.time.value += delta;
			this.lastUpdateTime = currentTime;
		}
	}

	public getMesh(): THREE.Mesh {
		return this.mesh;
	}

	public getPosition(): THREE.Vector2 {
		return this.position;
	}

	public getSize(): number {
		return this.size;
	}

	public updateUniforms(
		lightDirection: THREE.Vector3,
		fogColor: THREE.Color,
		fogDensity: number
	): void {
		this.uniforms.lightDirection.value = lightDirection;
		this.uniforms.fogColor.value = fogColor;
		this.uniforms.fogDensity.value = fogDensity;
	}

	public dispose(): void {
		// Dispose all geometries
		for (const geometry of this.geometries) {
			geometry.dispose();
		}

		if (this.mesh.material instanceof THREE.ShaderMaterial) {
			this.mesh.material.dispose();
		}
	}

	private fbm(pos: THREE.Vector2): number {
		let value = 0.0;
		let amplitude = 0.5;
		let frequency = 1.0;

		for (let i = 0; i < 4; i++) {
			value += amplitude * this.noise(pos.clone().multiplyScalar(frequency));
			pos.multiplyScalar(2.0);
			amplitude *= 0.5;
			frequency *= 2.0;
		}
		return value;
	}

	private noise(pos: THREE.Vector2): number {
		const i = new THREE.Vector2(Math.floor(pos.x), Math.floor(pos.y));
		const f = new THREE.Vector2(pos.x - i.x, pos.y - i.y);

		const a = this.random(i);
		const b = this.random(new THREE.Vector2(i.x + 1, i.y));
		const c = this.random(new THREE.Vector2(i.x, i.y + 1));
		const d = this.random(new THREE.Vector2(i.x + 1, i.y + 1));

		const u = new THREE.Vector2(f.x * f.x * (3.0 - 2.0 * f.x), f.y * f.y * (3.0 - 2.0 * f.y));

		return this.mix(this.mix(a, b, u.x), this.mix(c, d, u.x), u.y);
	}

	private random(pos: THREE.Vector2): number {
		return (Math.sin(pos.dot(new THREE.Vector2(12.9898, 78.233))) * 43758.5453123) % 1;
	}

	private mix(x: number, y: number, a: number): number {
		return x * (1 - a) + y * a;
	}

	private smoothstep(edge0: number, edge1: number, x: number): number {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	}
}

export class Terrain {
	private chunks: Map<string, TerrainChunk>;
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private sandTexture: THREE.Texture;
	private chunkSize: number;
	private viewDistance: number;
	private loadedChunks: Set<string>;
	private frustum: THREE.Frustum;
	private projScreenMatrix: THREE.Matrix4;
	private updateQueue: TerrainChunk[] = [];
	private readonly MAX_UPDATES_PER_FRAME = 4;
	private lastChunkUpdateTime = 0;
	private readonly CHUNK_UPDATE_INTERVAL = 0.1; // seconds
	private baseHeight: number;
	private isWireframeMode = false;

	constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, baseHeight = 0) {
		this.chunks = new Map();
		this.scene = scene;
		this.camera = camera;
		this.chunkSize = 32;
		this.viewDistance = 96; // Reduced view distance
		this.loadedChunks = new Set();
		this.frustum = new THREE.Frustum();
		this.projScreenMatrix = new THREE.Matrix4();
		this.baseHeight = baseHeight;

		// Load sand texture
		const textureLoader = new THREE.TextureLoader();
		this.sandTexture = textureLoader.load("/vibe-beach/textures/sand.jpg");
		this.sandTexture.wrapS = THREE.RepeatWrapping;
		this.sandTexture.wrapT = THREE.RepeatWrapping;
		this.sandTexture.repeat.set(20, 20);
		this.sandTexture.minFilter = THREE.NearestFilter;
		this.sandTexture.magFilter = THREE.NearestFilter;
		this.sandTexture.generateMipmaps = false;

		// Initialize chunks around the camera
		this.updateChunks();
	}

	public update(delta: number): void {
		const currentTime = performance.now() / 1000;

		// Update frustum less frequently
		if (currentTime - this.lastChunkUpdateTime >= this.CHUNK_UPDATE_INTERVAL) {
			this.projScreenMatrix.multiplyMatrices(
				this.camera.projectionMatrix,
				this.camera.matrixWorldInverse
			);
			this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
			this.updateChunks();
			this.lastChunkUpdateTime = currentTime;
		}

		// Process chunk updates in batches
		this.updateQueue = Array.from(this.chunks.values())
			.filter(chunk => this.isChunkVisible(chunk))
			.sort((a, b) => {
				const distA = new THREE.Vector2(
					this.camera.position.x - a.getPosition().x,
					this.camera.position.z - a.getPosition().y
				).length();
				const distB = new THREE.Vector2(
					this.camera.position.x - b.getPosition().x,
					this.camera.position.z - b.getPosition().y
				).length();
				return distA - distB;
			});

		// Update LOD for visible chunks
		for (const chunk of this.updateQueue) {
			chunk.updateLOD(this.camera.position);
		}

		// Process updates in batches
		const updatesThisFrame = Math.min(this.MAX_UPDATES_PER_FRAME, this.updateQueue.length);

		for (let i = 0; i < updatesThisFrame; i++) {
			const chunk = this.updateQueue[i];
			chunk.update(delta, currentTime);
		}
	}

	private updateChunks(): void {
		const cameraPosition = new THREE.Vector2(this.camera.position.x, this.camera.position.z);

		// Calculate chunk coordinates around camera
		const startX = Math.floor((cameraPosition.x - this.viewDistance) / this.chunkSize);
		const endX = Math.ceil((cameraPosition.x + this.viewDistance) / this.chunkSize);
		const startZ = Math.floor((cameraPosition.y - this.viewDistance) / this.chunkSize);
		const endZ = Math.ceil((cameraPosition.y + this.viewDistance) / this.chunkSize);

		// Load new chunks
		for (let x = startX; x <= endX; x++) {
			for (let z = startZ; z <= endZ; z++) {
				const chunkKey = `${x},${z}`;
				const chunkPos = new THREE.Vector2(x * this.chunkSize, z * this.chunkSize);

				if (!this.chunks.has(chunkKey)) {
					const chunk = new TerrainChunk(
						chunkPos,
						this.chunkSize,
						this.sandTexture,
						this.baseHeight
					);
					this.chunks.set(chunkKey, chunk);
					this.scene.add(chunk.getMesh());
				}
			}
		}

		// Unload distant chunks
		for (const [key, chunk] of this.chunks.entries()) {
			const distance = cameraPosition.distanceTo(chunk.getPosition());
			if (distance > this.viewDistance * 1.5) {
				this.scene.remove(chunk.getMesh());
				chunk.dispose();
				this.chunks.delete(key);
			}
		}
	}

	private isChunkVisible(chunk: TerrainChunk): boolean {
		const chunkBox = new THREE.Box3();
		const chunkSize = chunk.getSize();
		const chunkPos = chunk.getPosition();

		chunkBox.setFromCenterAndSize(
			new THREE.Vector3(chunkPos.x, 0, chunkPos.y),
			new THREE.Vector3(chunkSize, 20, chunkSize)
		);

		return this.frustum.intersectsBox(chunkBox);
	}

	public getHeightAt(x: number, z: number): number {
		// Find the chunk containing the point
		const chunkX = Math.floor(x / this.chunkSize);
		const chunkZ = Math.floor(z / this.chunkSize);
		const chunkKey = `${chunkX},${chunkZ}`;
		const chunk = this.chunks.get(chunkKey);

		if (!chunk) {
			return this.baseHeight;
		}

		// Sample the terrain height using the same noise function as the shader
		const noiseScale = 0.005;
		const heightScale = 12.0;
		const noiseStrength = 0.4;

		// Calculate distance from center
		const distFromCenter = Math.sqrt(x * x + z * z);
		const islandRadius = 40.0;

		// Generate height using multiple octaves of noise
		const noisePos = new THREE.Vector2(x, z).multiplyScalar(noiseScale);
		let height = this.fbm(noisePos) * heightScale * noiseStrength;

		// Add gentler variation based on position
		height += Math.sin(x * 0.03) * Math.cos(z * 0.03) * 0.05;

		// Create a more pronounced island shape
		const beachRadius = 45.0; // Added transition zone
		const beachHeight = -1.5; // Slightly higher beach
		const centerHeight = 4.0; // Slightly lower center elevation

		// Create smoother transitions
		const islandFactor = this.smoothstep(islandRadius, beachRadius, distFromCenter);
		const centerFactor = 1.0 - this.smoothstep(0.0, islandRadius * 0.7, distFromCenter); // Wider center influence

		// Add central elevation with smoother transition
		height += centerFactor * centerHeight;

		// Create gradual slope towards the ocean with smoother transition
		height = this.mix(height, beachHeight, islandFactor);

		return height + this.baseHeight;
	}

	public getNormalAt(x: number, z: number): THREE.Vector3 {
		// Sample heights at nearby points to calculate normal
		const delta = 0.1; // Small offset for sampling
		const hL = this.getHeightAt(x - delta, z);
		const hR = this.getHeightAt(x + delta, z);
		const hD = this.getHeightAt(x, z - delta);
		const hU = this.getHeightAt(x, z + delta);

		// Calculate normal using central differences
		const normal = new THREE.Vector3(hL - hR, 2.0 * delta, hD - hU).normalize();

		return normal;
	}

	private fbm(pos: THREE.Vector2): number {
		let value = 0.0;
		let amplitude = 0.5;
		let frequency = 1.0;

		for (let i = 0; i < 4; i++) {
			value += amplitude * this.noise(pos.clone().multiplyScalar(frequency));
			pos.multiplyScalar(2.0);
			amplitude *= 0.5;
			frequency *= 2.0;
		}
		return value;
	}

	private noise(pos: THREE.Vector2): number {
		const i = new THREE.Vector2(Math.floor(pos.x), Math.floor(pos.y));
		const f = new THREE.Vector2(pos.x - i.x, pos.y - i.y);

		const a = this.random(i);
		const b = this.random(new THREE.Vector2(i.x + 1, i.y));
		const c = this.random(new THREE.Vector2(i.x, i.y + 1));
		const d = this.random(new THREE.Vector2(i.x + 1, i.y + 1));

		const u = new THREE.Vector2(f.x * f.x * (3.0 - 2.0 * f.x), f.y * f.y * (3.0 - 2.0 * f.y));

		return this.mix(this.mix(a, b, u.x), this.mix(c, d, u.x), u.y);
	}

	private random(pos: THREE.Vector2): number {
		return (Math.sin(pos.dot(new THREE.Vector2(12.9898, 78.233))) * 43758.5453123) % 1;
	}

	private mix(x: number, y: number, a: number): number {
		return x * (1 - a) + y * a;
	}

	private smoothstep(edge0: number, edge1: number, x: number): number {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	}

	public updateUniforms(
		lightDirection: THREE.Vector3,
		fogColor: THREE.Color,
		fogDensity: number
	): void {
		for (const chunk of this.chunks.values()) {
			chunk.updateUniforms(lightDirection, fogColor, fogDensity);
		}
	}

	public dispose(): void {
		for (const chunk of this.chunks.values()) {
			this.scene.remove(chunk.getMesh());
			chunk.dispose();
		}
		this.chunks.clear();
		this.sandTexture.dispose();
	}

	public setWireframeMode(enabled: boolean): void {
		this.isWireframeMode = enabled;
		for (const chunk of this.chunks.values()) {
			const material = chunk.getMesh().material;
			if (
				material instanceof THREE.MeshStandardMaterial ||
				material instanceof THREE.ShaderMaterial
			) {
				material.wireframe = enabled;
			} else if (Array.isArray(material)) {
				for (const mat of material) {
					if (
						mat instanceof THREE.MeshStandardMaterial ||
						mat instanceof THREE.ShaderMaterial
					) {
						mat.wireframe = enabled;
					}
				}
			}
		}
	}

	public getChunkSize(): number {
		return this.chunkSize;
	}

	public getViewDistance(): number {
		return this.viewDistance;
	}
}
