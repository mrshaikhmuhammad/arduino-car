# Arduino Bluetooth Robot Car — Interactive 3D Showcase

A dark, cinematic, Apple-inspired 3D product showcase for an Arduino 4WD Bluetooth robotics platform. Built with **Three.js**, **GSAP ScrollTrigger**, and **Lenis** smooth scroll, configured via modular data-driven storyboards.

---

## Architecture Overview

The site is built as a **data-driven storyboard**:
- `src/sections.js` — Single source of truth for the 8 keyframes in the 3D scroll sequence (camera coordinates, targeted meshes, highlight shaders, and exploded view offsets).
- `src/team.js` — Single source of truth for the engineering team and institutional credits. Adding or updating a student requires only editing one line without touching any HTML.
- `src/ui.js` — Builds the frosted glass HUD cards, interactive 2S2P battery topology diagram, specs matrix, team grid, and institutional credits strip.
- `src/timeline.js` — Master GSAP scrub timeline controlling camera interpolation, part opacity, and exploded transformations.
- `src/scene.js` & `src/loadModel.js` — Studio lighting, environment map, material tuning, and GLTF model loading.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation & Local Development

1. Clone or extract the repository:
   ```bash
   cd robot-car-showcase
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build & Deployment

To compile an optimized static production bundle:

```bash
npm run build
```

The output will be generated in `dist/`. You can preview the production bundle locally:

```bash
npm run preview
```

### Deploying to Vercel or Netlify
- **Build command**: `npm run build`
- **Publish directory**: `dist`

> **Note on Sharing / Archiving**: When zipping or sharing the repository, exclude `node_modules/` and `.git/`. Running `npm install` automatically rebuilds all required packages.

---

## Customizing Team & Institutional Credits

Open [`src/team.js`](file:///home/muhammad/Downloads/robot-car-showcase/src/team.js):

```javascript
export const teamMembers = [
  {
    name: 'Student Name',
    role: 'Lead Systems & Hardware',
    contribution: 'Chassis design and power bus integration',
    photo: '/team/member-1.webp', // or leave blank for initials fallback
  },
  // Add additional members here...
];

export const projectCredits = {
  institution: 'Sukkur IBA University',
  course: 'Robotics & Autonomous Systems Capstone',
  supervisor: 'Faculty Project Supervisor',
  logos: [
    { name: 'Sukkur IBA University', src: '/institute-logo/iba-university.png', alt: 'Sukkur IBA Logo' },
    { name: 'Public School Sukkur', src: '/institute-logo/public-school.png', alt: 'Public School Sukkur Logo' },
  ],
};
```

---

## Showcase Sections

| Section | Focus Component | Description |
| :--- | :--- | :--- |
| **01** | Platform Overview | Hero camera overview of the complete 4WD chassis |
| **02** | Arduino Uno | ATmega328P microcontroller & real-time PWM control |
| **03** | HC-05 Module | 2.4 GHz wireless telemetry & SPP serial protocol |
| **04** | L298N Driver | High-current dual H-bridge motor switching |
| **05** | 18650 Battery Array | 7.4V 2S2P lithium power with interactive topology diagram |
| **06** | Quad DC Motors | 4WD differential traction and exploded drivetrain view |
| **07** | Specifications Matrix | Complete electrical and mechanical architecture |
| **08** | Engineering Team | Student contributors, supervisor, and partner institute logos |
