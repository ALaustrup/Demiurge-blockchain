/**
 * Genesis Mode Configuration
 * 
 * Genesis Mode is a cinematic demo mode that uses synthetic Fabric data
 * and scripted event sequences for demonstration purposes.
 */

export const GENESIS_MODE = process.env.NEXT_PUBLIC_GENESIS_MODE === "true";

export interface GenesisConfig {
  enabled: boolean;
  fabricNodeCount: number;
  phases: {
    stable: { duration: number };
    incursion: { duration: number };
    fracture: { duration: number };
    rebinding: { duration: number };
  };
}

export const GENESIS_CONFIG: GenesisConfig = {
  enabled: GENESIS_MODE,
  fabricNodeCount: 35, // 25-40 nodes
  phases: {
    stable: { duration: 30000 }, // 30 seconds
    incursion: { duration: 25000 }, // 25 seconds
    fracture: { duration: 20000 }, // 20 seconds
    rebinding: { duration: 30000 }, // 30 seconds
  },
};

