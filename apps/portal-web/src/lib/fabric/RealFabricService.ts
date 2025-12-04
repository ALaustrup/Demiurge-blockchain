/**
 * Real Fabric Service
 * 
 * Fetches live topology and metrics from a real P2P/Fabric stats API.
 * Normalizes the response into the same node/edge structures used by FabricTopology and HealthPanel.
 */

import { FABRIC_CONFIG } from "@/config/fabric";

export interface FabricNode {
  id: string;
  x: number;
  y: number;
  address: string;
  role: string;
  isActive: boolean;
  bandwidth: { up: number; down: number };
  latency: number;
  stability?: number;
}

export interface FabricEdge {
  from: string;
  to: string;
  strength: number;
  active: boolean;
  latency: number;
  bandwidth?: number;
}

export interface FabricTopologyResponse {
  nodes: Array<{
    id: string;
    address: string;
    role?: string;
    status: "online" | "offline" | "degraded";
    metrics: {
      bandwidth_up: number;
      bandwidth_down: number;
      latency_ms: number;
      stability?: number;
    };
    position?: { x: number; y: number };
  }>;
  edges: Array<{
    from: string;
    to: string;
    latency_ms: number;
    bandwidth_mbps?: number;
    status: "active" | "inactive";
  }>;
  metadata?: {
    total_nodes: number;
    active_nodes: number;
    network_health: number;
  };
}

/**
 * Normalize API response to internal format.
 */
function normalizeTopology(data: FabricTopologyResponse): { nodes: FabricNode[]; edges: FabricEdge[] } {
  const nodes: FabricNode[] = data.nodes.map((node, idx) => {
    // Generate positions if not provided (circular layout)
    const angle = (idx / data.nodes.length) * Math.PI * 2;
    const radius = 0.4;
    const x = node.position?.x ?? 0.5 + Math.cos(angle) * radius;
    const y = node.position?.y ?? 0.5 + Math.sin(angle) * radius;

    return {
      id: node.id,
      x,
      y,
      address: node.address,
      role: node.role || "RELAY",
      isActive: node.status === "online",
      bandwidth: {
        up: node.metrics.bandwidth_up || 0,
        down: node.metrics.bandwidth_down || 0,
      },
      latency: node.metrics.latency_ms || 0,
      stability: node.metrics.stability ?? (node.status === "online" ? 1.0 : 0.0),
    };
  });

  const edges: FabricEdge[] = data.edges.map((edge) => ({
    from: edge.from,
    to: edge.to,
    strength: edge.status === "active" ? 0.8 : 0.3,
    active: edge.status === "active",
    latency: edge.latency_ms || 0,
    bandwidth: edge.bandwidth_mbps || 0,
  }));

  return { nodes, edges };
}

export class RealFabricService {
  private endpoint: string;
  private refreshInterval: number;
  private updateInterval: NodeJS.Timeout | null = null;
  private onStateChange?: (nodes: FabricNode[], edges: FabricEdge[]) => void;
  private onError?: (error: Error) => void;

  constructor(mode: "real-devnet" | "real-prod") {
    this.endpoint = mode === "real-prod" 
      ? (FABRIC_CONFIG.endpoints.prod || "")
      : (FABRIC_CONFIG.endpoints.devnet || "");
    this.refreshInterval = FABRIC_CONFIG.refreshInterval;
  }

  /**
   * Fetch current topology from API.
   */
  async fetchTopology(): Promise<{ nodes: FabricNode[]; edges: FabricEdge[] }> {
    try {
      const response = await fetch(this.endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Fabric API error: ${response.status} ${response.statusText}`);
      }

      const data: FabricTopologyResponse = await response.json();
      return normalizeTopology(data);
    } catch (error: any) {
      console.error("Failed to fetch Fabric topology:", error);
      throw error;
    }
  }

  /**
   * Start periodic updates.
   */
  start(onStateChange?: (nodes: FabricNode[], edges: FabricEdge[]) => void, onError?: (error: Error) => void) {
    this.onStateChange = onStateChange;
    this.onError = onError;

    // Initial fetch
    this.fetchTopology()
      .then(({ nodes, edges }) => {
        this.onStateChange?.(nodes, edges);
      })
      .catch((error) => {
        this.onError?.(error);
      });

    // Periodic updates
    this.updateInterval = setInterval(() => {
      this.fetchTopology()
        .then(({ nodes, edges }) => {
          this.onStateChange?.(nodes, edges);
        })
        .catch((error) => {
          this.onError?.(error);
        });
    }, this.refreshInterval);
  }

  /**
   * Stop periodic updates.
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

