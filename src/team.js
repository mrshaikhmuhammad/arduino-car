/**
 * src/team.js - Single source of truth for the project team and institutional credits.
 *
 * To add or edit a contributor, edit or append an entry in the `teamMembers` array below.
 * Adding a student means editing one line, with no HTML changes.
 */

export const teamMembers = [
  {
    name: 'Shaikh Ayyan',
    role: 'Lead Systems & Hardware',
    contribution: 'Chassis CAD design, vibration isolation, and dual acrylic deck integration',
    photo: '/team/member-1.webp',
  },
  {
    name: 'Shaikh Ahmed',
    role: 'Embedded Firmware',
    contribution: 'ATmega328P motor PWM regulation and HC-05 UART command processing',
    photo: '/team/member-2.webp',
  },
  {
    name: 'Tayyab',
    role: 'Power Electronics',
    contribution: '2S2P 18650 lithium array assembly and rail decoupling to prevent brownouts',
    photo: '/team/member-3.webp',
  },
  {
    name: 'Abdul Sami',
    role: 'Wireless Telemetry & Control',
    contribution: '2.4 GHz Bluetooth serial stack and smartphone remote control pipeline',
    photo: '/team/member-4.webp',
  },
];

export const projectCredits = {
  institution: 'IBA Public School',
  course: 'Robotics & Autonomous Systems Capstone',
  supervisor: 'Faculty Project Supervisor',
  partner: 'Sukkur IBA University',
  logos: [
    {
      name: 'IBA Public School',
      src: '/institute-logo/public-school.png',
      alt: 'IBA Public School Logo',
    },
    {
      name: 'Sukkur IBA University',
      src: '/institute-logo/iba-university.png',
      alt: 'Sukkur IBA University Logo',
    },
  ],
};
