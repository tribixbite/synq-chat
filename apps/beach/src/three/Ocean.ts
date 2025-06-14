import * as THREE from "three";

export class Ocean {
	private ocean: THREE.Mesh;
	private time = 0;
	private uniforms: {
		time: { value: number };
		waveHeight: { value: number };
		waveSpeed: { value: number };
		waveLength: { value: number };
		noiseScale: { value: number };
		noiseStrength: { value: number };
		waterColor: { value: THREE.Color };
		waterOpacity: { value: number };
		maxDepth: { value: number };
	};

	constructor() {
		// Create ocean geometry
		const geometry = new THREE.PlaneGeometry(1000, 1000, 128, 128);
		geometry.rotateX(-Math.PI / 2);

		// Create shader uniforms with adjusted values
		this.uniforms = {
			time: { value: 0 },
			waveHeight: { value: 0.2 },
			waveSpeed: { value: 0.8 },
			waveLength: { value: 8.0 },
			noiseScale: { value: 0.05 },
			noiseStrength: { value: 0.3 },
			waterColor: { value: new THREE.Color(0x87ceeb) },
			waterOpacity: { value: 0.2 },
			maxDepth: { value: 20.0 }
		};

		// Create shader material
		const material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: `
        uniform float time;
        uniform float waveHeight;
        uniform float waveSpeed;
        uniform float waveLength;
        uniform float noiseScale;
        uniform float noiseStrength;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vWaveHeight;
        varying float vDepth;
        varying vec2 vNoisePos;
        
        // Improved noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(st * frequency);
            st *= 2.0;
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          vec3 pos = position;
          
          // Base wave pattern
          float wave1 = sin(pos.x / waveLength + time * waveSpeed) * 
                      cos(pos.z / waveLength + time * waveSpeed);
          
          float wave2 = sin(pos.x / (waveLength * 0.5) + time * waveSpeed * 1.2) * 
                      cos(pos.z / (waveLength * 0.5) + time * waveSpeed * 1.2);
          
          // Add noise-based waves
          vec2 noisePos = pos.xz * noiseScale;
          float noiseWave = fbm(noisePos + time * waveSpeed * 0.5);
          
          // Combine waves with noise
          float wave = (wave1 + wave2 * 0.5 + noiseWave * noiseStrength) * waveHeight;
          
          pos.y += wave;
          
          // Calculate normal with improved accuracy
          float dx1 = cos(pos.x / waveLength + time * waveSpeed) * 
                    cos(pos.z / waveLength + time * waveSpeed) * 
                    waveHeight / waveLength;
          float dz1 = sin(pos.x / waveLength + time * waveSpeed) * 
                    -sin(pos.z / waveLength + time * waveSpeed) * 
                    waveHeight / waveLength;
                    
          float dx2 = cos(pos.x / (waveLength * 0.5) + time * waveSpeed * 1.2) * 
                    cos(pos.z / (waveLength * 0.5) + time * waveSpeed * 1.2) * 
                    waveHeight / (waveLength * 0.5);
          float dz2 = sin(pos.x / (waveLength * 0.5) + time * waveSpeed * 1.2) * 
                    -sin(pos.z / (waveLength * 0.5) + time * waveSpeed * 1.2) * 
                    waveHeight / (waveLength * 0.5);
          
          // Add noise-based normal variation
          vec2 noisePos2 = pos.xz * noiseScale * 2.0;
          float noiseDx = fbm(noisePos2 + vec2(0.1, 0.0) + time * waveSpeed * 0.5);
          float noiseDz = fbm(noisePos2 + vec2(0.0, 0.1) + time * waveSpeed * 0.5);
          
          vec3 normal = normalize(vec3(
            -(dx1 + dx2 * 0.5 + noiseDx * noiseStrength),
            1.0,
            -(dz1 + dz2 * 0.5 + noiseDz * noiseStrength)
          ));
          
          vDepth = -pos.y;
          vNormal = normal;
          vPosition = pos;
          vWaveHeight = wave;
          vNoisePos = pos.xz * 0.1 + time * 0.2; // For foam noise
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
			fragmentShader: `
        uniform float time;
        uniform vec3 waterColor;
        uniform float waterOpacity;
        uniform float maxDepth;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vWaveHeight;
        varying float vDepth;
        varying vec2 vNoisePos;
        
        // Improved noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(st * frequency);
            st *= 2.0;
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          // Calculate water color with depth
          float depthFactor = smoothstep(0.0, maxDepth, vDepth);
          vec3 color = mix(waterColor, waterColor * 0.7, depthFactor);
          
          // Calculate foam using multiple noise layers
          float foamNoise1 = fbm(vNoisePos);
          float foamNoise2 = fbm(vNoisePos * 2.0 + 10.0);
          float foamNoise3 = fbm(vNoisePos * 4.0 + 20.0);
          
          // Combine noise layers for more interesting foam pattern
          float foamPattern = (foamNoise1 * 0.5 + foamNoise2 * 0.3 + foamNoise3 * 0.2);
          
          // Wave peak foam
          float waveFoam = smoothstep(0.0, 0.2, vWaveHeight) * 
                          (1.0 - smoothstep(0.2, 0.4, vWaveHeight));
          
          // Shore foam
          float shoreDistance = length(vPosition.xz);
          float shoreFoam = smoothstep(45.0, 50.0, shoreDistance) * 
                          (1.0 - smoothstep(50.0, 55.0, shoreDistance));
          
          // Combine foam effects with noise
          float foamAmount = max(waveFoam, shoreFoam) * foamPattern;
          
          // Add foam to color
          color = mix(color, vec3(1.0), foamAmount);
          
          // Add specular highlights
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float spec = pow(max(dot(reflect(-lightDir, vNormal), normalize(vPosition)), 0.0), 32.0);
          color += spec * 0.3;
          
          gl_FragColor = vec4(color, waterOpacity);
        }
      `,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide
		});

		// Create mesh
		this.ocean = new THREE.Mesh(geometry, material);
		this.ocean.position.y = 0;
	}

	public update(delta: number): void {
		this.time += delta;
		this.uniforms.time.value = this.time;
	}

	public getMesh(): THREE.Mesh {
		return this.ocean;
	}

	public dispose(): void {
		this.ocean.geometry.dispose();
		if (this.ocean.material instanceof THREE.ShaderMaterial) {
			this.ocean.material.dispose();
		}
	}
}
