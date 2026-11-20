/**
 * src/scene.js - Three.js studio environment, camera, lighting, and rendering loop.
 */

import * as THREE from 'three';

export class StudioScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070709);
    this.scene.fog = new THREE.FogExp2(0x070709, 0.16);

    // Car root container
    this.carRoot = new THREE.Group();
    this.carRoot.name = 'carRoot';
    this.scene.add(this.carRoot);

    // Initial camera setup
    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    this.camera.position.set(2.2, 1.3, 2.2);
    this.currentLookAt = new THREE.Vector3(0.0, 0.2, 0.0);
    this.targetLookAt = new THREE.Vector3(0.0, 0.2, 0.0);
    this.camera.lookAt(this.currentLookAt);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Idle rotation parameters
    this.idleRotationSpeed = 0.001;
    this.isIdleEnabled = true;

    this.setupLighting();
    this.setupGround();
    this.setupEventListeners();
    this.updateCameraForScreenSize();
    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    // Key studio light (casts soft shadows)
    this.keyLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    this.keyLight.position.set(4, 7, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.camera.left = -3;
    this.keyLight.shadow.camera.right = 3;
    this.keyLight.shadow.camera.top = 3;
    this.keyLight.shadow.camera.bottom = -3;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.radius = 3;
    this.scene.add(this.keyLight);

    // Fill light (cool tone)
    this.fillLight = new THREE.DirectionalLight(0x8bc34a, 0.4);
    this.fillLight.position.set(-5, 4, -3);
    this.scene.add(this.fillLight);

    // Rim / Backlight for specular rim sheen on edges
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    this.rimLight.position.set(-3, 5, -5);
    this.scene.add(this.rimLight);

    // Secondary subtle rim light
    this.secondaryRim = new THREE.DirectionalLight(0x818cf8, 1.4);
    this.secondaryRim.position.set(4, 2, -4);
    this.scene.add(this.secondaryRim);

    // Under-body accent point light for high-tech ground reflection
    this.underglow = new THREE.PointLight(0x2563eb, 0.8, 4);
    this.underglow.position.set(0, -0.05, 0);
    this.scene.add(this.underglow);
  }

  setupGround() {
    // Ground shadow receiver plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(20, 20);
    const shadowPlaneMat = new THREE.ShadowMaterial({
      opacity: 0.5,
    });
    this.shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -0.002;
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.shadowPlane);

    // Subtle dark circular studio pedestal / radial ground falloff
    const discGeo = new THREE.CircleGeometry(3.5, 64);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x0f1118,
      transparent: true,
      opacity: 0.75,
    });
    this.disc = new THREE.Mesh(discGeo, discMat);
    this.disc.rotation.x = -Math.PI / 2;
    this.disc.position.y = -0.004;
    this.scene.add(this.disc);

    // Studio grid accents
    const gridHelper = new THREE.GridHelper(8, 20, 0x1e293b, 0x0e131f);
    gridHelper.position.y = -0.005;
    this.scene.add(gridHelper);
  }

  updateCameraForScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;

    // Mobile / Portrait responsive framing
    if (aspect < 1.0) {
      this.camera.fov = 54;
    } else if (aspect < 1.4) {
      this.camera.fov = 46;
    } else {
      this.camera.fov = 40;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.updateCameraForScreenSize();
    });

    // When scrolling begins, smoothly disable idle rotation and lock car rotation to 0
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        this.isIdleEnabled = false;
        if (this.carRoot) this.carRoot.rotation.y = 0;
      } else {
        this.isIdleEnabled = true;
      }
    });
  }

  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }

  setCameraLookAt(x, y, z) {
    this.targetLookAt.set(x, y, z);
    this.currentLookAt.copy(this.targetLookAt);
    this.camera.lookAt(this.currentLookAt);
  }

  animate() {
    this.rafId = requestAnimationFrame(this.animate);

    // Subtle idle rotation only when resting at the top hero section
    if (this.isIdleEnabled && this.carRoot && window.scrollY <= 10) {
      this.carRoot.rotation.y += this.idleRotationSpeed;
    } else if (this.carRoot && !this.isIdleEnabled) {
      this.carRoot.rotation.y = 0;
    }

    this.camera.lookAt(this.currentLookAt);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
  }
}
