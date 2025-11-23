/**
 * The Seven Archons - System NPC users for chat.
 * 
 * This mirrors the backend archons.ts for UI display.
 */

export interface Archon {
  username: string;
  displayName: string;
  description: string;
}

export const THE_SEVEN_ARCHONS: Archon[] = [
  {
    username: "ialdabaoth",
    displayName: "Ialdabaoth — The Sovereign",
    description: "Master of CGT, Archonic Tax, and order",
  },
  {
    username: "sabaoth",
    displayName: "Sabaoth — The Guardian",
    description: "Protector of security and integrity",
  },
  {
    username: "abrasax",
    displayName: "Abrasax — The Oracle",
    description: "Seer of analytics and market insights",
  },
  {
    username: "yao",
    displayName: "Yao — The Scribe",
    description: "Keeper of docs and metadata",
  },
  {
    username: "astaphaios",
    displayName: "Astaphaios — The Strategist",
    description: "Guide to optimization and efficiency",
  },
  {
    username: "adonaios",
    displayName: "Adonaios — The Cartographer",
    description: "Mapper of Fabric topology and networks",
  },
  {
    username: "elaios",
    displayName: "Elaios — The Mentor",
    description: "Teacher of onboarding and guidance",
  },
];

