/**
 * Fabric Mode Configuration
 * 
 * Controls which Fabric data source to use:
 * - genesis: Synthetic Fabric from GenesisFabricService
 * - real-devnet: Real Fabric from devnet endpoint
 * - real-prod: Real Fabric from production endpoint
 */

export type FabricMode = "genesis" | "real-devnet" | "real-prod";

export const FABRIC_MODE: FabricMode = (process.env.NEXT_PUBLIC_FABRIC_MODE as FabricMode) || "genesis";

export interface FabricConfig {
  mode: FabricMode;
  endpoints: {
    devnet?: string;
    prod?: string;
  };
  refreshInterval: number; // milliseconds
}

export const FABRIC_CONFIG: FabricConfig = {
  mode: FABRIC_MODE,
  endpoints: {
    devnet: process.env.NEXT_PUBLIC_FABRIC_DEVNET_ENDPOINT || "http://localhost:8080/api/fabric",
    prod: process.env.NEXT_PUBLIC_FABRIC_PROD_ENDPOINT || "https://fabric.demiurge.xyz/api/fabric",
  },
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_FABRIC_REFRESH_INTERVAL || "5000", 10), // 5 seconds
};

