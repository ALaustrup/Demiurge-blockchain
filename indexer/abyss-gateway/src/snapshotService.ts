/**
 * Snapshot Service
 * 
 * Background service for creating periodic system snapshots.
 * Can be triggered on intervals or on key events (ritual phase change, Archon proposal application, etc.).
 */

import { getRituals, getRitualById, createSystemSnapshot, createSystemEvent } from "./chatDb";

const DEMIURGE_RPC_URL = process.env.DEMIURGE_RPC_URL || "http://127.0.0.1:8545/rpc";

interface FabricSnapshot {
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    address: string;
    isActive: boolean;
    bandwidth: { up: number; down: number };
    latency: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    strength: number;
    active: boolean;
  }>;
}

/**
 * Create a system snapshot by aggregating current state from multiple sources.
 * Gracefully handles missing or partial data.
 */
export async function createSystemSnapshotNow(label?: string): Promise<string> {
  try {
    // 1. Get current rituals (with error handling)
    let ritualsState: any[] = [];
    try {
      const rituals = getRituals();
      const activeRituals = rituals.filter((r: any) => 
        r.phase === "active" || r.phase === "peaking" || r.phase === "initiating"
      );
      ritualsState = activeRituals.map((r: any) => {
        try {
          return {
            id: r.id,
            name: r.name,
            phase: r.phase,
            parameters: r.parameters ? JSON.parse(r.parameters) : {},
          };
        } catch (e) {
          // If JSON parse fails, use empty object
          console.warn(`Failed to parse ritual ${r.id} parameters:`, e);
          return {
            id: r.id,
            name: r.name,
            phase: r.phase,
            parameters: {},
          };
        }
      });
    } catch (error: any) {
      console.warn("Failed to fetch rituals for snapshot:", error.message);
      // Continue with empty rituals state
    }

    // 2. Get Dev Capsules (sample from first few owners or all if manageable)
    // For now, we'll create a summary rather than all capsules
    const capsulesState: any[] = [];
    // TODO: If we have a way to list all capsules, use that
    // For now, capsules are owner-specific, so we'll leave this as an empty array
    // or fetch from a known set of addresses

    // 3. Fabric state (mock for now - in production, fetch from Fabric P2P service)
    // Gracefully handle missing Fabric data
    let fabricState: FabricSnapshot;
    try {
      fabricState = {
        nodes: [],
        edges: [],
      };
    } catch (error: any) {
      console.warn("Failed to fetch Fabric state for snapshot:", error.message);
      fabricState = { nodes: [], edges: [] };
    }

    // 4. Shader state (derived from active rituals, with error handling)
    let shaderState: any = {};
    try {
      if (ritualsState.length > 0) {
        const firstRitual = getRitualById(ritualsState[0].id);
        if (firstRitual?.effects) {
          try {
            const effects = JSON.parse(firstRitual.effects);
            shaderState = effects?.shaderUniforms || {};
          } catch (e) {
            console.warn("Failed to parse shader state from ritual effects:", e);
          }
        }
      }
    } catch (error: any) {
      console.warn("Failed to derive shader state:", error.message);
    }

    // 5. Create snapshot (always succeeds even with partial data)
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      const snapshot = createSystemSnapshot(
        snapshotId,
        label || `Snapshot ${new Date().toISOString()}`,
        JSON.stringify(fabricState),
        JSON.stringify(ritualsState),
        JSON.stringify(capsulesState),
        JSON.stringify(shaderState),
        JSON.stringify({
          timestamp: Date.now(),
          source: "snapshot_service",
          dataCompleteness: {
            rituals: ritualsState.length > 0,
            capsules: capsulesState.length > 0,
            fabric: fabricState.nodes.length > 0,
            shader: Object.keys(shaderState).length > 0,
          },
        })
      );

      // 6. Create corresponding system event
      try {
        const eventId = `sys_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        createSystemEvent(
          eventId,
          "system",
          "snapshot_service",
          `System Snapshot Created: ${label || snapshotId}`,
          `Snapshot captured with ${ritualsState.length} active rituals`,
          JSON.stringify({ snapshotId }),
          snapshotId
        );
      } catch (eventError: any) {
        // Log but don't fail snapshot creation if event creation fails
        console.warn("Failed to create snapshot event:", eventError.message);
      }

      return snapshotId;
    } catch (snapshotError: any) {
      console.error("Failed to persist snapshot:", snapshotError);
      throw snapshotError;
    }
  } catch (error: any) {
    console.error("Failed to create system snapshot:", error);
    throw error;
  }
}

/**
 * Start periodic snapshot creation.
 * @param intervalMs Interval in milliseconds (default: 5 minutes)
 */
export function startSnapshotService(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  console.log(`Starting snapshot service with interval: ${intervalMs}ms`);
  
  // Create initial snapshot
  createSystemSnapshotNow("Initial snapshot");

  // Set up interval
  const interval = setInterval(() => {
    createSystemSnapshotNow().catch((err) => {
      console.error("Periodic snapshot creation failed:", err);
    });
  }, intervalMs);

  return interval;
}

/**
 * Stop snapshot service.
 */
export function stopSnapshotService(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log("Snapshot service stopped");
}

/**
 * Create snapshot on ritual phase change.
 */
export function createSnapshotOnRitualPhaseChange(ritualId: string, phase: string): void {
  createSystemSnapshotNow(`Ritual ${ritualId} phase: ${phase}`).catch((err) => {
    console.error("Ritual phase snapshot creation failed:", err);
  });
}

/**
 * Create snapshot on ArchonAI proposal application.
 */
export function createSnapshotOnProposalApplication(proposalId: string): void {
  createSystemSnapshotNow(`ArchonAI proposal applied: ${proposalId}`).catch((err) => {
    console.error("Proposal application snapshot creation failed:", err);
  });
}

