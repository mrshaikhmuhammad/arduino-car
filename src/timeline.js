/**
 * src/timeline.js - Orchestrates Lenis smooth scrolling, GSAP ScrollTrigger timeline,
 * camera keyframing, component highlights, and exploded view transformations.
 */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

export function initTimeline(scene, modelData, sections, onSectionChange) {
  const { partMap, initialTransforms } = modelData;

  // 1. Initialize Lenis smooth scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // 2. Camera proxy object for smooth interpolation
  const startSec = sections[0];
  const camProxy = {
    x: startSec.cameraPosition.x,
    y: startSec.cameraPosition.y,
    z: startSec.cameraPosition.z,
    lookX: startSec.cameraLookAt.x,
    lookY: startSec.cameraLookAt.y,
    lookZ: startSec.cameraLookAt.z,
    carRotY: 0,
  };

  // Explode animation proxies
  const explodeProxy = {
    batteryLift: 0,
    motorOffset: 0,
    wheelOffset: 0,
  };

  // Apply initial camera
  scene.setCameraPosition(camProxy.x, camProxy.y, camProxy.z);
  scene.setCameraLookAt(camProxy.lookX, camProxy.lookY, camProxy.lookZ);

  // 3. Create master scrub timeline
  const masterTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate: (self) => {
        // Calculate active section index
        const progress = self.progress;
        const total = sections.length;
        const activeIndex = Math.min(
          total - 1,
          Math.floor(progress * total)
        );
        if (onSectionChange) {
          onSectionChange(activeIndex, progress);
        }
      },
    },
  });

  const sectionDuration = 2.0;

  // 4. Construct keyframe transitions from sections.js
  for (let i = 0; i < sections.length - 1; i++) {
    const curSec = sections[i];
    const nextSec = sections[i + 1];

    const stepTL = gsap.timeline();

    // Camera move & lookAt tween
    stepTL.to(
      camProxy,
      {
        x: nextSec.cameraPosition.x,
        y: nextSec.cameraPosition.y,
        z: nextSec.cameraPosition.z,
        lookX: nextSec.cameraLookAt.x,
        lookY: nextSec.cameraLookAt.y,
        lookZ: nextSec.cameraLookAt.z,
        duration: sectionDuration,
        ease: 'power2.inOut',
        onUpdate: () => {
          scene.setCameraPosition(camProxy.x, camProxy.y, camProxy.z);
          scene.setCameraLookAt(camProxy.lookX, camProxy.lookY, camProxy.lookZ);
        },
      },
      0
    );

    // Exploded view tweening
    const targetBatteryLift = nextSec.id === 'batteries' ? 0.35 : 0;
    const targetMotorOffset = nextSec.id === 'motors' ? 0.28 : 0;
    const targetWheelOffset = nextSec.id === 'motors' ? 0.45 : 0;

    stepTL.to(
      explodeProxy,
      {
        batteryLift: targetBatteryLift,
        motorOffset: targetMotorOffset,
        wheelOffset: targetWheelOffset,
        duration: sectionDuration,
        ease: 'power2.inOut',
        onUpdate: () => {
          updateExplodedTransforms(partMap, initialTransforms, explodeProxy);
        },
      },
      0
    );

    // Component highlight tween
    stepTL.to(
      {},
      {
        duration: sectionDuration,
        onStart: () => applyHighlights(partMap, nextSec.highlight),
        onReverseComplete: () => applyHighlights(partMap, curSec.highlight),
      },
      0
    );

    masterTL.add(stepTL);
  }

  // Set initial highlight for hero section
  applyHighlights(partMap, startSec.highlight);

  return { lenis, masterTL };
}

/**
 * Updates positions for exploded view animations (batteries lifting, motors & wheels decoupling).
 */
function updateExplodedTransforms(partMap, initialTransforms, explodeProxy) {
  // Batteries lift vertically and spread slightly
  ['battery_1', 'battery_2', 'battery_3', 'battery_4'].forEach((name, i) => {
    const part = partMap.get(name);
    const init = initialTransforms.get(name);
    if (part && init) {
      const spreadZ = (i - 1.5) * 0.08 * (explodeProxy.batteryLift / 0.35);
      part.position.y = init.position.y + explodeProxy.batteryLift;
      part.position.z = init.position.z + spreadZ;
    }
  });

  // Motors expand outward
  const motorSigns = [
    { name: 'motor_1', dx: 0.5, dz: 1 },
    { name: 'motor_2', dx: 0.5, dz: -1 },
    { name: 'motor_3', dx: -0.5, dz: 1 },
    { name: 'motor_4', dx: -0.5, dz: -1 },
  ];

  motorSigns.forEach(({ name, dx, dz }) => {
    const part = partMap.get(name);
    const init = initialTransforms.get(name);
    if (part && init) {
      part.position.x = init.position.x + dx * explodeProxy.motorOffset;
      part.position.z = init.position.z + dz * explodeProxy.motorOffset;
    }
  });

  // Wheels slide further outward on their axles
  const wheelSigns = [
    { name: 'wheel_1', dx: 0.5, dz: 1 },
    { name: 'wheel_2', dx: 0.5, dz: -1 },
    { name: 'wheel_3', dx: -0.5, dz: 1 },
    { name: 'wheel_4', dx: -0.5, dz: -1 },
  ];

  wheelSigns.forEach(({ name, dx, dz }) => {
    const part = partMap.get(name);
    const init = initialTransforms.get(name);
    if (part && init) {
      part.position.x = init.position.x + dx * (explodeProxy.motorOffset + 0.1);
      part.position.z = init.position.z + dz * explodeProxy.wheelOffset;
    }
  });
}

/**
 * Highlights active component(s) with emissive accent glow while subtly dimming the rest.
 */
function applyHighlights(partMap, highlightList = []) {
  const isGlobalView = !highlightList || highlightList.length === 0;

  partMap.forEach((object, name) => {
    const isTarget = highlightList.includes(name);

    object.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const mat = child.material;

      if (isGlobalView) {
        // Reset to original appearance
        if (child.userData.originalEmissive) {
          mat.emissive = child.userData.originalEmissive.clone();
        } else {
          mat.emissive = new THREE.Color(0x000000);
        }
        if (child.userData.originalColor) {
          mat.color.copy(child.userData.originalColor);
        }
        mat.opacity = 1.0;
        mat.transparent = mat.transmission ? true : false;
      } else if (isTarget) {
        // Active component: vibrant cyan/blue highlight glow
        mat.emissive = new THREE.Color(0x0284c7);
        mat.emissiveIntensity = 0.75;
        if (child.userData.originalColor) {
          mat.color.copy(child.userData.originalColor);
        }
        mat.opacity = 1.0;
      } else {
        // Dim inactive component to direct visual focus
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
        if (child.userData.originalColor) {
          // Dim diffuse color
          mat.color.copy(child.userData.originalColor).multiplyScalar(0.45);
        }
      }
    });
  });
}
