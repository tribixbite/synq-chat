import * as THREE from "three";
import type { Terrain } from "./Terrain";

// Custom event for song changes
export class SongChangeEvent extends Event {
	constructor(public songTitle: string) {
		super("songchange");
	}
}

export class Jukebox {
	private scene: THREE.Scene;
	private terrain: Terrain;
	private jukeboxGroup: THREE.Group;
	private audioListener: THREE.AudioListener;
	private audio: THREE.Audio;
	private isPlaying = false;
	private isMuted = false;
	private lastVolume = 0.3; // Store the last non-zero volume
	private currentSong: number = Math.floor(Math.random() * 2); // Random song index
	private songs: string[] = [
		"ost/Vibe Beach.mp3",
		"ost/Goth Vibe Beach.mp3"
		// "ost/German Beach.mp3",
		// "ost/Weeb Beach.mp3",
		// "ost/Metal Beach.mp3",
		// "ost/Strandvibes.mp3",
		// "ost/Swag Beach.mp3",
		// "ost/Flemish Beach.mp3",
	];

	private songTitles: string[] = [
		"Sunset Serenade - Jack Sanderson & The Beachcombers",
		"Midnight Tide - Luna Blackwood"
		// "Der Strand lebt - Klaus Fischer & Die Strandkörbe",
		// "Vibu Bīchi☆Etānaru - ヴィブビーチ ☆ エターナル - Yuki Tanaka & ビーチ☆ガールズ (Beach☆Girls)",
		// "Thunder Beach - Axel Storm & Metal Tide",
		// "Strandvibes - Pieter van Dijk",
		// "Swag In De Lucht - Anneke van der Meer",
		// "'t Ritme Leeft Hier - Janneke & De Strandgasten",
	];

	private initAudioHandler: (() => void) | null = null;

	constructor(scene: THREE.Scene, terrain: Terrain) {
		this.scene = scene;
		this.terrain = terrain;
		this.jukeboxGroup = new THREE.Group();
		this.audioListener = new THREE.AudioListener();
		this.audio = new THREE.Audio(this.audioListener);

		this.createJukeboxModel();
		this.setupAudio();
		this.scene.add(this.jukeboxGroup);

		// Initialize audio after first user interaction
		this.initAudioHandler = () => {
			if (!this.isPlaying) {
				this.audio.play();
				this.isPlaying = true;
			}
			// Remove event listeners after first interaction
			this.removeInitListeners();
		};

		this.addInitListeners();
	}

	private addInitListeners(): void {
		if (this.initAudioHandler) {
			document.addEventListener("click", this.initAudioHandler);
			document.addEventListener("keydown", this.initAudioHandler);
		}
	}

	private removeInitListeners(): void {
		if (this.initAudioHandler) {
			document.removeEventListener("click", this.initAudioHandler);
			document.removeEventListener("keydown", this.initAudioHandler);
			this.initAudioHandler = null;
		}
	}

	public dispose(): void {
		// Stop any playing audio
		if (this.audio.isPlaying) {
			this.audio.stop();
		}
		this.isPlaying = false;

		// Remove event listeners
		this.removeInitListeners();

		// Remove from scene
		this.scene.remove(this.jukeboxGroup);

		// Dispose of audio resources
		if (this.audio.buffer) {
			this.audio.buffer = null;
		}
		this.audio.disconnect();
	}

	private createJukeboxModel(): void {
		// Base
		const baseGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.8);
		const baseMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b4513,
			roughness: 0.8,
			metalness: 0.2
		});
		const base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.y = 0.05;
		this.jukeboxGroup.add(base);

		// Main body
		const bodyGeometry = new THREE.BoxGeometry(1.0, 1.2, 0.6);
		const bodyMaterial = new THREE.MeshStandardMaterial({
			color: 0x1e90ff,
			roughness: 0.7,
			metalness: 0.3
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 0.7;
		this.jukeboxGroup.add(body);

		// Speaker grills
		const grillGeometry = new THREE.CircleGeometry(0.15, 32);
		const grillMaterial = new THREE.MeshStandardMaterial({
			color: 0x000000,
			roughness: 0.9,
			metalness: 0.1
		});

		// Left speaker
		const leftGrill = new THREE.Mesh(grillGeometry, grillMaterial);
		leftGrill.position.set(-0.3, 0.7, 0.31);
		leftGrill.rotation.y = Math.PI;
		this.jukeboxGroup.add(leftGrill);

		// Right speaker
		const rightGrill = new THREE.Mesh(grillGeometry, grillMaterial);
		rightGrill.position.set(0.3, 0.7, 0.31);
		rightGrill.rotation.y = Math.PI;
		this.jukeboxGroup.add(rightGrill);

		// Control panel
		const panelGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.1);
		const panelMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			roughness: 0.5,
			metalness: 0.5
		});
		const panel = new THREE.Mesh(panelGeometry, panelMaterial);
		panel.position.set(0, 1.3, 0.31);
		this.jukeboxGroup.add(panel);

		// Buttons
		const buttonGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
		const buttonMaterial = new THREE.MeshStandardMaterial({
			color: 0xff0000,
			roughness: 0.3,
			metalness: 0.7
		});

		// Play button
		const playButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
		playButton.position.set(-0.2, 1.3, 0.36);
		playButton.rotation.x = Math.PI / 2;
		this.jukeboxGroup.add(playButton);

		// Next button
		const nextButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
		nextButton.position.set(0.2, 1.3, 0.36);
		nextButton.rotation.x = Math.PI / 2;
		this.jukeboxGroup.add(nextButton);

		// Add shadows
		this.jukeboxGroup.traverse(object => {
			if (object instanceof THREE.Mesh) {
				object.castShadow = true;
				object.receiveShadow = true;
			}
		});
	}

	private setupAudio(): void {
		const audioLoader = new THREE.AudioLoader();
		const songPath = this.songs[this.currentSong];

		audioLoader.load(
			songPath,
			// onLoad callback
			buffer => {
				this.audio.setBuffer(buffer);
				this.audio.setVolume(0.3);
				this.audio.setLoop(true);

				// Dispatch event when song is loaded
				const songTitle = this.getCurrentSongTitle();
				document.dispatchEvent(new SongChangeEvent(songTitle));
			},
			// onProgress callback
			xhr => {
				console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
			},
			// onError callback
			error => {
				console.error("Error loading audio:", error);
			}
		);
	}

	private getCurrentSongTitle(): string {
		return this.songTitles[this.currentSong];
	}

	public setPosition(position: THREE.Vector3): void {
		this.jukeboxGroup.position.copy(position);
	}

	public togglePlay(): void {
		this.isMuted = !this.isMuted;
		if (this.isMuted) {
			this.lastVolume = this.audio.getVolume(); // Store current volume before muting
			this.audio.setVolume(0);
		} else {
			this.audio.setVolume(this.lastVolume);
		}
	}

	public setVolume(volume: number): void {
		this.audio.setVolume(volume);
		if (volume > 0) {
			this.lastVolume = volume; // Update last volume when setting a non-zero volume
		}
		// Update muted state based on volume
		this.isMuted = volume === 0;
	}

	public nextSong(): void {
		this.currentSong = (this.currentSong + 1) % this.songs.length;
		this.audio.stop();

		const audioLoader = new THREE.AudioLoader();
		audioLoader.load(this.songs[this.currentSong], buffer => {
			this.audio.setBuffer(buffer);
			if (this.isPlaying) {
				this.audio.play();
				// Dispatch event when song changes
				const songTitle = this.getCurrentSongTitle();
				document.dispatchEvent(new SongChangeEvent(songTitle));
			}
		});
	}

	public getPosition(): THREE.Vector3 {
		return this.jukeboxGroup.position.clone();
	}

	public isNearby(playerPosition: THREE.Vector3, distance = 3): boolean {
		return this.jukeboxGroup.position.distanceTo(playerPosition) < distance;
	}

	public setAudioListener(camera: THREE.Camera): void {
		camera.add(this.audioListener);
	}

	public getMutedState(): boolean {
		return this.isMuted;
	}
}
