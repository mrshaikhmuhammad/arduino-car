/**
 * src/main.js - Application bootstrap: binds Three.js scene, model loader,
 * UI generation, and scroll timeline.
 */

import { StudioScene } from './scene.js';
import { loadCarModel } from './loadModel.js';
import { sections } from './sections.js';
import { initTimeline } from './timeline.js';
import { buildUI, setupLoadingScreen } from './ui.js';

async function bootstrap() {
  const loading = setupLoadingScreen();
  const webglContainer = document.getElementById('webgl-container');

  try {
    // 1. Initialize Three.js studio environment
    const scene = new StudioScene(webglContainer);

    // 2. Construct DOM sections and HUD directly from sections.js
    const { onSectionChange, setLenis } = buildUI(sections);

    // 3. Load GLTF car model (or fallback to procedural car)
    const modelData = await loadCarModel(scene.carRoot, (progress) => {
      loading.updateProgress(progress);
    });

    // 4. Initialize GSAP timeline & Lenis smooth scroll
    const { lenis } = initTimeline(scene, modelData, sections, onSectionChange);

    // 5. Connect Lenis instance to UI navigation
    setLenis(lenis);

    // Ensure loading screen completes
    loading.updateProgress(100);
  } catch (error) {
    console.error('Bootstrap failure:', error);
    loading.updateProgress(100);
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
