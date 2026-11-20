/**
 * src/ui.js - Dynamic UI rendering, Apple-style typography cards, scroll progress bar,
 * interactive 2S2P power flow explanation, and specs matrix.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function buildUI(sections) {
  const scrollContainer = document.getElementById('scroll-container');
  const progressLine = document.getElementById('progress-line');
  const activeSectionNumber = document.getElementById('active-section-number');
  const navDotsContainer = document.getElementById('nav-dots');

  let activeLenis = null;

  scrollContainer.innerHTML = '';
  navDotsContainer.innerHTML = '';

  // 1. Build DOM sections driven directly by sections.js
  sections.forEach((sec, idx) => {
    const secEl = document.createElement('section');
    secEl.className = 'story-section';
    secEl.id = `section-${sec.id}`;
    secEl.dataset.index = idx;

    // Card alignment layout (alternating left / right for cinematic Apple pacing)
    const alignClass = idx === 0 ? 'align-center' : idx % 2 === 1 ? 'align-left' : 'align-right';

    let extraContent = '';

    // Scroll Cue on Hero
    if (idx === 0) {
      extraContent = `
        <div class="scroll-cue" aria-hidden="true">
          <span>Scroll to Explore</span>
          <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </div>
      `;
    }

    // Power flow diagram for batteries section
    if (sec.id === 'batteries') {
      extraContent = `
        <div class="power-flow-card">
          <div class="power-flow-header">
            <span class="power-tag">2S2P Topology</span>
            <span class="voltage-readout">7.4 V Nominal</span>
          </div>
          <div class="power-diagram">
            <div class="power-node cell-node">
              <div class="node-icon">🔋</div>
              <div class="node-text">
                <strong>4× 18650 Cells</strong>
                <small>2S2P Pack • 7.4V Nominal</small>
              </div>
            </div>
            <div class="power-branches">
              <div class="branch branch-motors">
                <div class="node-arrow">➔</div>
                <div class="node-text">
                  <strong>High-Current Rail (7.4V)</strong>
                  <span>L298N Driver ➔ 4× DC Motors</span>
                </div>
              </div>
              <div class="branch branch-logic">
                <div class="node-arrow">➔</div>
                <div class="node-text">
                  <strong>Regulated Rail (5.0V)</strong>
                  <span>Arduino Uno Logic & HC-05 Telemetry</span>
                </div>
              </div>
            </div>
          </div>
          <div class="power-caption">
            Differential drive induces heavy inductive motor kickback. The 2S2P parallel arrangement provides low internal impedance, preventing logic brownouts during hard stall turns.
          </div>
        </div>
      `;
    }

    // Specifications matrix for specs section
    if (sec.id === 'specs') {
      extraContent = `
        <div class="specs-grid">
          <div class="spec-card">
            <div class="spec-label">Microcontroller</div>
            <div class="spec-value">Arduino Uno R3</div>
            <div class="spec-detail">16 MHz ATmega328P • 32 KB Flash • 2 KB SRAM</div>
          </div>
          <div class="spec-card">
            <div class="spec-label">Wireless Telemetry</div>
            <div class="spec-value">HC-05 Bluetooth</div>
            <div class="spec-detail">2.4 GHz ISM Band • SPP Protocol • 38.4k Baud</div>
          </div>
          <div class="spec-card">
            <div class="spec-label">Power Architecture</div>
            <div class="spec-value">4× 18650 Li-ion (2S2P)</div>
            <div class="spec-detail">7.4V Nominal • Decoupled Microcontroller Rail</div>
          </div>
          <div class="spec-card">
            <div class="spec-label">Motor Stage</div>
            <div class="spec-value">L298N Dual H-Bridge</div>
            <div class="spec-detail">2 Channels • 2A Peak per Rail • PWM Speed Control</div>
          </div>
          <div class="spec-card">
            <div class="spec-label">Drivetrain</div>
            <div class="spec-value">Quad DC Gearmotors</div>
            <div class="spec-detail">Differential Tank Steering • Zero Turning Radius</div>
          </div>
          <div class="spec-card">
            <div class="spec-label">Chassis</div>
            <div class="spec-value">Dual Acrylic Deck</div>
            <div class="spec-detail">Modular Mounting Grid • Brass Vibration Standoffs</div>
          </div>
        </div>
      `;
    }

    secEl.innerHTML = `
      <div class="section-content ${alignClass}">
        ${sec.eyebrow ? `<p class="eyebrow">${sec.eyebrow}</p>` : ''}
        <h2 class="section-title">${sec.title}</h2>
        <p class="section-copy">${sec.copy}</p>
        ${sec.badge ? `<div class="spec-badge">${sec.badge}</div>` : ''}
        ${extraContent}
      </div>
    `;

    scrollContainer.appendChild(secEl);

    // 2. Build Dot Navigation
    const dot = document.createElement('button');
    dot.className = `nav-dot ${idx === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Navigate to ${sec.title}`);
    dot.addEventListener('click', () => {
      const targetPos = secEl.offsetTop;
      if (activeLenis) {
        activeLenis.scrollTo(targetPos, { duration: 1.4 });
      } else {
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
    navDotsContainer.appendChild(dot);
  });

  // 3. Section ScrollTrigger Fade In/Out
  sections.forEach((sec, idx) => {
    const secEl = document.getElementById(`section-${sec.id}`);
    const content = secEl.querySelector('.section-content');

    gsap.fromTo(
      content,
      {
        opacity: idx === 0 ? 1 : 0,
        y: idx === 0 ? 0 : 35,
      },
      {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: secEl,
          start: 'top 65%',
          end: 'bottom 35%',
          toggleActions: 'play reverse play reverse',
        },
      }
    );
  });

  // 4. Update HUD progress indicator
  const onSectionChange = (activeIndex, overallProgress) => {
    // Update top slim line
    if (progressLine) {
      progressLine.style.transform = `scaleX(${overallProgress})`;
    }

    // Update section counter (e.g. 02 / 07)
    if (activeSectionNumber) {
      const curNum = String(activeIndex + 1).padStart(2, '0');
      const totNum = String(sections.length).padStart(2, '0');
      activeSectionNumber.textContent = `${curNum} / ${totNum}`;
    }

    // Update active nav dot
    const dots = navDotsContainer.querySelectorAll('.nav-dot');
    dots.forEach((dot, dIdx) => {
      dot.classList.toggle('active', dIdx === activeIndex);
    });
  };

  return {
    onSectionChange,
    setLenis: (lenisInstance) => {
      activeLenis = lenisInstance;
    },
  };
}

/**
 * Handles the loading overlay progress and smooth dismiss.
 */
export function setupLoadingScreen() {
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingBar = document.getElementById('loading-bar');
  const loadingPercent = document.getElementById('loading-percent');

  const updateProgress = (pct) => {
    if (loadingBar) loadingBar.style.width = `${pct}%`;
    if (loadingPercent) loadingPercent.textContent = `${pct}%`;

    if (pct >= 100) {
      setTimeout(() => {
        if (loadingOverlay) {
          loadingOverlay.classList.add('loaded');
          setTimeout(() => {
            loadingOverlay.style.display = 'none';
          }, 800);
        }
      }, 400);
    }
  };

  return { updateProgress };
}
