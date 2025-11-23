/**
 * The Seven Archons - System NPC users for chat.
 * 
 * These are special system identities that users can message.
 * In the future, they will be powered by AI.
 */

import { chatDb, getChatDb } from "./chatDb";

export interface Archon {
  username: string;
  address: string; // Deterministic pseudo-address
  displayName: string;
  description: string;
}

export const THE_SEVEN_ARCHONS: Archon[] = [
  {
    username: "ialdabaoth",
    address: "archon:ialdabaoth",
    displayName: "Ialdabaoth — The Sovereign",
    description: "Master of CGT, Archonic Tax, and order",
  },
  {
    username: "sabaoth",
    address: "archon:sabaoth",
    displayName: "Sabaoth — The Guardian",
    description: "Protector of security and integrity",
  },
  {
    username: "abrasax",
    address: "archon:abrasax",
    displayName: "Abrasax — The Oracle",
    description: "Seer of analytics and market insights",
  },
  {
    username: "yao",
    address: "archon:yao",
    displayName: "Yao — The Scribe",
    description: "Keeper of docs and metadata",
  },
  {
    username: "astaphaios",
    address: "archon:astaphaios",
    displayName: "Astaphaios — The Strategist",
    description: "Guide to optimization and efficiency",
  },
  {
    username: "adonaios",
    address: "archon:adonaios",
    displayName: "Adonaios — The Cartographer",
    description: "Mapper of Fabric topology and networks",
  },
  {
    username: "elaios",
    address: "archon:elaios",
    displayName: "Elaios — The Mentor",
    description: "Teacher of onboarding and guidance",
  },
];

/**
 * Register all Archon NPCs in the chat database.
 * Idempotent - will not create duplicates.
 */
export function registerArchons() {
  for (const archon of THE_SEVEN_ARCHONS) {
    // Check if already exists
    const existing = chatDb.getUserByUsername(archon.username);
    
    if (!existing) {
      // Insert new Archon
      const db = getChatDb();
      db.prepare(
        "INSERT INTO chat_users (address, username, display_name, is_archon) VALUES (?, ?, ?, 1)"
      ).run(archon.address, archon.username, archon.displayName);
      
      console.log(`Registered Archon: @${archon.username}`);
    }
  }
}

/**
 * Get Archon by username.
 */
export function getArchonByUsername(username: string): Archon | null {
  return THE_SEVEN_ARCHONS.find(
    (a) => a.username.toLowerCase() === username.toLowerCase()
  ) || null;
}

