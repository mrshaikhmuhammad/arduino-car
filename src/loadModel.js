/**
 * src/loadModel.js - Robust GLTF & DRACO loader with automatic semantic grouping
 * and procedural fallback generator matching all expected mesh names.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export async function loadCarModel(carRoot, onProgress) {
  const partMap = new Map();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const modelCandidates = ['/models/car.glb', 'models/car.glb', '/car.glb', 'car.glb'];

  let loadedScene = null;

  for (const url of modelCandidates) {
    try {
      loadedScene = await new Promise((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(gltf.scene),
          (xhr) => {
            if (onProgress && xhr.total) {
              onProgress(Math.min(95, Math.round((xhr.loaded / xhr.total) * 95)));
            }
          },
          (err) => reject(err)
        );
      });
      if (loadedScene) break;
    } catch {
      // Continue searching next path
    }
  }

  if (loadedScene) {
    processLoadedGLB(loadedScene, carRoot, partMap);
  } else {
    // Generate procedural placeholder car matching identical mesh names
    console.warn('Real GLB not reachable; generating procedural placeholder car.');
    createPlaceholderCar(carRoot, partMap);
  }

  if (onProgress) onProgress(100);

  // Cache initial local transforms for all mapped parts (needed for exploded animations)
  const initialTransforms = new Map();
  partMap.forEach((object, name) => {
    initialTransforms.set(name, {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone(),
    });
  });

  return { partMap, initialTransforms };
}

/**
 * Normalizes, centers, and groups incoming GLB nodes to expected semantic part names.
 */
function processLoadedGLB(model, carRoot, partMap) {
  // Update matrix world before computing bounding box
  model.updateMatrixWorld(true);

  // Compute bounds to center and scale comfortably
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Scale up to ~2.0 units across
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim < 0.8 ? 10.0 : maxDim > 5.0 ? 2.0 / maxDim : 1.0;

  model.scale.setScalar(scale);

  // Center model at origin with wheels resting on y = 0
  model.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);

  model.position.x = -scaledCenter.x;
  model.position.y = -scaledBox.min.y;
  model.position.z = -scaledCenter.z;
  model.updateMatrixWorld(true);

  // Check if root or model already has exact named meshes
  const expectedNames = [
    'chassis', 'arduino', 'hc05', 'driver',
    'battery_1', 'battery_2', 'battery_3', 'battery_4',
    'motor_1', 'motor_2', 'motor_3', 'motor_4',
    'wheel_1', 'wheel_2', 'wheel_3', 'wheel_4'
  ];

  let directMatchCount = 0;
  model.traverse((child) => {
    if (expectedNames.includes(child.name)) {
      partMap.set(child.name, child);
      directMatchCount++;
    }
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material = child.material.clone();
        child.userData.originalColor = child.material.color?.clone();
        child.userData.originalEmissive = child.material.emissive?.clone() || new THREE.Color(0x000000);
      }
    }
  });

  // If already mapped by exact names, we are done
  if (directMatchCount >= 8) {
    carRoot.add(model);
    return;
  }

  // Create semantic assembly groups
  const groups = {
    chassis: new THREE.Group(),
    arduino: new THREE.Group(),
    hc05: new THREE.Group(),
    driver: new THREE.Group(),
    battery_1: new THREE.Group(),
    battery_2: new THREE.Group(),
    battery_3: new THREE.Group(),
    battery_4: new THREE.Group(),
    motor_1: new THREE.Group(),
    motor_2: new THREE.Group(),
    motor_3: new THREE.Group(),
    motor_4: new THREE.Group(),
    wheel_1: new THREE.Group(),
    wheel_2: new THREE.Group(),
    wheel_3: new THREE.Group(),
    wheel_4: new THREE.Group(),
  };

  Object.keys(groups).forEach((key) => {
    groups[key].name = key;
    model.add(groups[key]);
    partMap.set(key, groups[key]);
  });

  // Collect candidate nodes to attach
  const nodesToClassify = [];
  model.traverse((child) => {
    if (child !== model && !Object.values(groups).includes(child)) {
      nodesToClassify.push(child);
    }
  });

  nodesToClassify.forEach((node) => {
    const n = (node.name || '').toLowerCase();

    // Determine target group
    let target = null;
    if (n.includes('arduino') || n.includes('atmega') || n.includes('quartz') || n.includes('usb') || n.includes('barrel jack')) {
      target = groups.arduino;
    } else if (n.includes('hc-05') || n.includes('bluetooth') || n.includes('radio metal shield')) {
      target = groups.hc05;
    } else if (n.includes('l298n') || n.includes('heatsink') || n.includes('motor driver')) {
      target = groups.driver;
    } else if (n.includes('cell 1') || n.includes('cell_1') || n.includes('battery_1')) {
      target = groups.battery_1;
    } else if (n.includes('cell 2') || n.includes('cell_2') || n.includes('battery_2')) {
      target = groups.battery_2;
    } else if (n.includes('cell 3') || n.includes('cell_3') || n.includes('battery_3')) {
      target = groups.battery_3;
    } else if (n.includes('cell 4') || n.includes('cell_4') || n.includes('battery_4')) {
      target = groups.battery_4;
    } else if (n.includes('l_0') && (n.includes('gearmotor') || n.includes('axle') || n.includes('motor mount') || n.includes('motor bracket'))) {
      target = groups.motor_1;
    } else if (n.includes('r_0') && (n.includes('gearmotor') || n.includes('axle') || n.includes('motor mount') || n.includes('motor bracket'))) {
      target = groups.motor_2;
    } else if (n.includes('l_1') && (n.includes('gearmotor') || n.includes('axle') || n.includes('motor mount') || n.includes('motor bracket'))) {
      target = groups.motor_3;
    } else if (n.includes('r_1') && (n.includes('gearmotor') || n.includes('axle') || n.includes('motor mount') || n.includes('motor bracket'))) {
      target = groups.motor_4;
    } else if (n.includes('front_left') || (n.includes('fl') && (n.includes('wheel') || n.includes('tyre')))) {
      target = groups.wheel_1;
    } else if (n.includes('front_right') || (n.includes('fr') && (n.includes('wheel') || n.includes('tyre')))) {
      target = groups.wheel_2;
    } else if (n.includes('rear_left') || (n.includes('rl') && (n.includes('wheel') || n.includes('tyre')))) {
      target = groups.wheel_3;
    } else if (n.includes('rear_right') || (n.includes('rr') && (n.includes('wheel') || n.includes('tyre')))) {
      target = groups.wheel_4;
    } else if (n.includes('acrylic') || n.includes('chassis') || n.includes('deck') || n.includes('spacer') || n.includes('screw') || n.includes('holder')) {
      target = groups.chassis;
    }

    if (target && node.parent !== target) {
      target.attach(node);
    }
  });

  carRoot.add(model);
}

/**
 * High-fidelity procedural fallback car generator.
 * Produces every required named mesh with studio PBR materials:
 * chassis, arduino, hc05, driver, battery_1..4, motor_1..4, wheel_1..4.
 */
export function createPlaceholderCar(carRoot, partMap) {
  const container = new THREE.Group();
  container.name = 'proceduralCar';

  // 1. Chassis: Acrylic dual-deck plates with standoffs
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'chassis';

  const acrylicMat = new THREE.MeshPhysicalMaterial({
    color: 0x181820,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.85,
    thickness: 0.05,
    transparent: true,
    opacity: 0.8,
  });

  // Lower chassis
  const lowerPlateGeo = new THREE.BoxGeometry(2.0, 0.03, 1.3);
  const lowerPlate = new THREE.Mesh(lowerPlateGeo, acrylicMat);
  lowerPlate.position.set(0, 0.28, 0);
  lowerPlate.castShadow = true;
  chassisGroup.add(lowerPlate);

  // Upper equipment deck
  const upperPlateGeo = new THREE.BoxGeometry(1.8, 0.03, 1.2);
  const upperPlate = new THREE.Mesh(upperPlateGeo, acrylicMat);
  upperPlate.position.set(0, 0.52, 0);
  upperPlate.castShadow = true;
  chassisGroup.add(upperPlate);

  // Standoff brass spacers
  const standoffMat = new THREE.MeshStandardMaterial({ color: 0xcca050, metalness: 0.9, roughness: 0.3 });
  const standoffGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.24, 16);
  const standoffOffsets = [
    [-0.8, 0.4, -0.5],
    [-0.8, 0.4, 0.5],
    [0.8, 0.4, -0.5],
    [0.8, 0.4, 0.5],
  ];
  standoffOffsets.forEach(([x, y, z]) => {
    const post = new THREE.Mesh(standoffGeo, standoffMat);
    post.position.set(x, y, z);
    post.castShadow = true;
    chassisGroup.add(post);
  });

  container.add(chassisGroup);
  partMap.set('chassis', chassisGroup);

  // 2. Arduino Uno (The Brain)
  const arduinoGroup = new THREE.Group();
  arduinoGroup.name = 'arduino';
  arduinoGroup.position.set(0.45, 0.55, 0.0);

  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x008184, roughness: 0.4 });
  const pcbGeo = new THREE.BoxGeometry(0.7, 0.02, 0.53);
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  pcb.castShadow = true;
  arduinoGroup.add(pcb);

  // ATmega328P DIP IC
  const icMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  const icGeo = new THREE.BoxGeometry(0.35, 0.03, 0.09);
  const ic = new THREE.Mesh(icGeo, icMat);
  ic.position.set(0.05, 0.02, 0.06);
  arduinoGroup.add(ic);

  // USB Metal Type-B Jack
  const usbMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
  const usbGeo = new THREE.BoxGeometry(0.16, 0.12, 0.12);
  const usb = new THREE.Mesh(usbGeo, usbMat);
  usb.position.set(0.28, 0.07, -0.16);
  arduinoGroup.add(usb);

  // DC Barrel Jack
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const barrelGeo = new THREE.BoxGeometry(0.15, 0.11, 0.11);
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.position.set(0.28, 0.06, 0.16);
  arduinoGroup.add(barrel);

  // Pin headers
  const headerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
  const headerGeo1 = new THREE.BoxGeometry(0.48, 0.08, 0.025);
  const header1 = new THREE.Mesh(headerGeo1, headerMat);
  header1.position.set(-0.06, 0.05, 0.24);
  const header2 = new THREE.Mesh(headerGeo1, headerMat);
  header2.position.set(-0.06, 0.05, -0.24);
  arduinoGroup.add(header1, header2);

  container.add(arduinoGroup);
  partMap.set('arduino', arduinoGroup);

  // 3. HC-05 Bluetooth Module
  const hc05Group = new THREE.Group();
  hc05Group.name = 'hc05';
  hc05Group.position.set(-0.1, 0.55, 0.38);

  const btPcbMat = new THREE.MeshStandardMaterial({ color: 0x006677, roughness: 0.3 });
  const btPcbGeo = new THREE.BoxGeometry(0.38, 0.015, 0.2);
  const btPcb = new THREE.Mesh(btPcbGeo, btPcbMat);
  hc05Group.add(btPcb);

  // Radio RF shield
  const rfShieldMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.25 });
  const rfShieldGeo = new THREE.BoxGeometry(0.18, 0.025, 0.16);
  const rfShield = new THREE.Mesh(rfShieldGeo, rfShieldMat);
  rfShield.position.set(-0.06, 0.02, 0);
  hc05Group.add(rfShield);

  // Status LED (Blinking blue pulse)
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 });
  const ledGeo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.set(0.12, 0.02, 0.05);
  hc05Group.add(led);

  container.add(hc05Group);
  partMap.set('hc05', hc05Group);

  // 4. L298N Dual H-Bridge Motor Driver
  const driverGroup = new THREE.Group();
  driverGroup.name = 'driver';
  driverGroup.position.set(-0.05, 0.55, -0.15);

  const driverPcbMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
  const driverPcbGeo = new THREE.BoxGeometry(0.48, 0.02, 0.46);
  const driverPcb = new THREE.Mesh(driverPcbGeo, driverPcbMat);
  driverGroup.add(driverPcb);

  // Black finned aluminum heatsink
  const sinkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });
  const sinkBaseGeo = new THREE.BoxGeometry(0.14, 0.24, 0.36);
  const sink = new THREE.Mesh(sinkBaseGeo, sinkMat);
  sink.position.set(0.04, 0.13, 0);
  sink.castShadow = true;
  driverGroup.add(sink);

  // Blue screw terminals
  const termMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
  const termGeo = new THREE.BoxGeometry(0.08, 0.1, 0.16);
  const term1 = new THREE.Mesh(termGeo, termMat);
  term1.position.set(-0.18, 0.06, 0.12);
  const term2 = new THREE.Mesh(termGeo, termMat);
  term2.position.set(-0.18, 0.06, -0.12);
  driverGroup.add(term1, term2);

  // Electrolytic capacitors
  const capMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.4 });
  const capGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16);
  const cap1 = new THREE.Mesh(capGeo, capMat);
  cap1.position.set(-0.05, 0.07, 0.15);
  driverGroup.add(cap1);

  container.add(driverGroup);
  partMap.set('driver', driverGroup);

  // 5. Four 18650 Lithium Cells (2S2P)
  const cellMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.2, roughness: 0.3 });
  const capNickelMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.9, roughness: 0.2 });
  const cellGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.65, 24);
  const buttonGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16);

  const batteryPositions = [
    [-0.45, 0.62, 0.22],
    [-0.45, 0.62, 0.07],
    [-0.45, 0.62, -0.07],
    [-0.45, 0.62, -0.22],
  ];

  batteryPositions.forEach(([x, y, z], idx) => {
    const bGroup = new THREE.Group();
    bGroup.name = `battery_${idx + 1}`;
    bGroup.position.set(x, y, z);

    const cellMesh = new THREE.Mesh(cellGeo, cellMat);
    cellMesh.rotation.z = Math.PI / 2;
    cellMesh.castShadow = true;
    bGroup.add(cellMesh);

    const capMesh = new THREE.Mesh(buttonGeo, capNickelMat);
    capMesh.rotation.z = Math.PI / 2;
    capMesh.position.set(0.33, 0, 0);
    bGroup.add(capMesh);

    container.add(bGroup);
    partMap.set(`battery_${idx + 1}`, bGroup);
  });

  // 6. Motors and Wheels (4x DC gearmotors + 4x Wheels)
  const motorMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const motorBodyGeo = new THREE.BoxGeometry(0.42, 0.18, 0.18);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35 });
  const tireGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 32);
  const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.17, 16);

  const motorConfigs = [
    { name: 'motor_1', wheel: 'wheel_1', pos: [0.65, 0.18, 0.48], rimZ: 0.22 },
    { name: 'motor_2', wheel: 'wheel_2', pos: [0.65, 0.18, -0.48], rimZ: -0.22 },
    { name: 'motor_3', wheel: 'wheel_3', pos: [-0.65, 0.18, 0.48], rimZ: 0.22 },
    { name: 'motor_4', wheel: 'wheel_4', pos: [-0.65, 0.18, -0.48], rimZ: -0.22 },
  ];

  motorConfigs.forEach((cfg) => {
    // Gear motor
    const mGroup = new THREE.Group();
    mGroup.name = cfg.name;
    mGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

    const mMesh = new THREE.Mesh(motorBodyGeo, motorMat);
    mMesh.castShadow = true;
    mGroup.add(mMesh);
    container.add(mGroup);
    partMap.set(cfg.name, mGroup);

    // Wheel
    const wGroup = new THREE.Group();
    wGroup.name = cfg.wheel;
    wGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2] + cfg.rimZ);

    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    wGroup.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = true;
    wGroup.add(rim);

    container.add(wGroup);
    partMap.set(cfg.wheel, wGroup);
  });

  carRoot.add(container);
}
