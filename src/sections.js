/**
 * src/sections.js - Single source of truth for the scroll-driven storyboard.
 *
 * Each entry configures one keyframe in the GSAP scrub timeline:
 * - id: unique section identifier
 * - eyebrow: Apple-style category subtitle
 * - title: section headline
 * - copy: single-sentence caption
 * - badge: short hardware specification pill
 * - targetMesh: name(s) of targeted mesh(es)
 * - cameraPosition: { x, y, z } target camera coordinates
 * - cameraLookAt: { x, y, z } camera focus point
 * - highlight: array of mesh names to illuminate / isolate
 * - explode: boolean triggering component separation offset
 */

export const sections = [
  {
    id: 'hero',
    eyebrow: 'ARDUINO BT ROBOT PLATFORM',
    title: 'Precision in Motion.',
    copy: 'An open-architecture robotics platform powered by Arduino, engineered for responsive wireless control and raw differential torque.',
    badge: 'Differential 4WD • 2.4 GHz Telemetry • 7.4V 2S2P',
    targetMesh: null,
    cameraPosition: { x: 2.2, y: 1.3, z: 2.2 },
    cameraLookAt: { x: 0.0, y: 0.2, z: 0.0 },
    highlight: [],
    explode: false,
  },
  {
    id: 'arduino',
    eyebrow: 'CENTRAL PROCESSING',
    title: 'Arduino Uno. The Brain.',
    copy: 'ATmega328P architecture orchestrating real-time motor PWM, sensor telemetry, and deterministic command execution.',
    badge: '16 MHz ATmega328P • 14 Digital I/O • 5V Logic',
    targetMesh: 'arduino',
    cameraPosition: { x: 0.8, y: 1.5, z: 0.5 },
    cameraLookAt: { x: 0.55, y: 0.45, z: 0.0 },
    highlight: ['arduino'],
    explode: false,
  },
  {
    id: 'hc05',
    eyebrow: 'WIRELESS PROTOCOL',
    title: 'HC-05 Bluetooth. Zero-Lag Telemetry.',
    copy: 'High-throughput 2.4 GHz wireless serial link bridging smartphone control inputs straight to the microcontroller.',
    badge: '2.4 GHz ISM Band • SPP Protocol • 9600-115200 Baud',
    targetMesh: 'hc05',
    cameraPosition: { x: 0.2, y: 0.85, z: 1.4 },
    cameraLookAt: { x: -0.1, y: 0.4, z: 0.65 },
    highlight: ['hc05'],
    explode: false,
  },
  {
    id: 'driver',
    eyebrow: 'POWER PROPULSION STAGE',
    title: 'L298N Dual H-Bridge. High-Current Switching.',
    copy: 'Two high-power channels driving left and right motor banks independently for sharp tank-style differential steering.',
    badge: 'Dual H-Bridge • Up to 2A per channel • Differential Steering',
    targetMesh: 'driver',
    cameraPosition: { x: 0.2, y: 1.3, z: -0.9 },
    cameraLookAt: { x: 0.05, y: 0.45, z: -0.15 },
    highlight: ['driver'],
    explode: false,
  },
  {
    id: 'batteries',
    eyebrow: 'ENERGY STORAGE & DISTRIBUTION',
    title: '4× 18650 Cells. 7.4V Sustained Current.',
    copy: 'A 2S2P lithium-ion array delivering balanced 7.4 V power, shielding logic electronics from motor voltage drops.',
    badge: '2S2P Lithium Array • 7.4V Nominal • Decoupled Logic & Motor Rails',
    targetMesh: ['battery_1', 'battery_2', 'battery_3', 'battery_4'],
    cameraPosition: { x: -1.6, y: 1.4, z: 0.4 },
    cameraLookAt: { x: -0.5, y: 0.55, z: 0.0 },
    highlight: ['battery_1', 'battery_2', 'battery_3', 'battery_4'],
    explode: true,
  },
  {
    id: 'motors',
    eyebrow: 'QUAD DRIVETRAIN',
    title: 'Quad DC Motors. True All-Wheel Drive.',
    copy: 'Four high-torque gearboxes powering all four wheels with synchronized left/right differential rotation for instant zero-point turns.',
    badge: '4× High-Torque Gearmotors • Tank-Style Steering • 4WD Grip',
    targetMesh: ['motor_1', 'motor_2', 'motor_3', 'motor_4', 'wheel_1', 'wheel_2', 'wheel_3', 'wheel_4'],
    cameraPosition: { x: 1.3, y: 0.65, z: 1.6 },
    cameraLookAt: { x: 0.35, y: 0.3, z: 0.4 },
    highlight: ['motor_1', 'motor_2', 'motor_3', 'motor_4', 'wheel_1', 'wheel_2', 'wheel_3', 'wheel_4'],
    explode: true,
  },
  {
    id: 'specs',
    eyebrow: 'HARDWARE ARCHITECTURE',
    title: 'Engineered Down to Every Trace.',
    copy: 'Modular 7.4V power distribution, 4WD differential traction, and high-speed serial control unified in an accessible chassis.',
    badge: 'Complete System Architecture Matrix',
    targetMesh: null,
    cameraPosition: { x: 2.4, y: 1.8, z: 2.6 },
    cameraLookAt: { x: 0.0, y: 0.25, z: 0.0 },
    highlight: [],
    explode: false,
  },
  {
    id: 'team',
    eyebrow: 'ENGINEERING CONTRIBUTORS',
    title: 'The Team Behind the Robot.',
    copy: 'Engineered from raw silicon, acrylic chassis decks, and differential drive gearmotors by our student robotics cohort.',
    badge: 'Hardware Engineering • Firmware • Power Systems • Telemetry',
    targetMesh: null,
    cameraPosition: { x: 2.2, y: 1.3, z: 2.2 },
    cameraLookAt: { x: 0.0, y: 0.2, z: 0.0 },
    highlight: [],
    explode: false,
  },
];
