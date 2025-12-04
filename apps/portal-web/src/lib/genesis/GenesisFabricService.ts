/**
 * Genesis Fabric Service
 * 
 * Generates synthetic Fabric network data for demo mode.
 * Produces nodes with roles (GATE, BEACON, RELAY, ARCHON) and scripted network phases.
 */

import { GENESIS_CONFIG } from "@/config/genesis";

export type NodeRole = "GATE" | "BEACON" | "RELAY" | "ARCHON";

export interface GenesisNode {
  id: string;
  x: number;
  y: number;
  address: string;
  role: NodeRole;
  isActive: boolean;
  bandwidth: { up: number; down: number };
  latency: number;
  stability: number; // 0.0 - 1.0, affects visual state
}

export interface GenesisEdge {
  from: string;
  to: string;
  strength: number;
  active: boolean;
  latency: number;
  bandwidth: number;
}

export type GenesisPhase = "stable" | "incursion" | "fracture" | "rebinding";

export interface GenesisFabricState {
  nodes: GenesisNode[];
  edges: GenesisEdge[];
  phase: GenesisPhase;
  phaseStartTime: number;
  anomalies: string[]; // Node IDs with anomalies
}

/**
 * Generate initial stable network topology.
 */
function generateInitialTopology(): { nodes: GenesisNode[]; edges: GenesisEdge[] } {
  const nodeCount = GENESIS_CONFIG.fabricNodeCount;
  const nodes: GenesisNode[] = [];
  const edges: GenesisEdge[] = [];

  // Role distribution
  const roleCounts = {
    GATE: Math.floor(nodeCount * 0.15), // ~15%
    BEACON: Math.floor(nodeCount * 0.25), // ~25%
    RELAY: Math.floor(nodeCount * 0.50), // ~50%
    ARCHON: Math.floor(nodeCount * 0.10), // ~10%
  };

  // Generate nodes in a hierarchical layout
  const centerX = 0.5;
  const centerY = 0.5;
  let nodeIndex = 0;

  // GATE nodes (central, high capacity)
  for (let i = 0; i < roleCounts.GATE; i++) {
    const angle = (i / roleCounts.GATE) * Math.PI * 2;
    const radius = 0.15;
    nodes.push({
      id: `genesis-gate-${i}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      address: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      role: "GATE",
      isActive: true,
      bandwidth: { up: 50 + Math.random() * 20, down: 100 + Math.random() * 30 },
      latency: 5 + Math.random() * 5,
      stability: 1.0,
    });
    nodeIndex++;
  }

  // ARCHON nodes (strategic positions)
  for (let i = 0; i < roleCounts.ARCHON; i++) {
    const angle = (i / roleCounts.ARCHON) * Math.PI * 2 + Math.PI / 4;
    const radius = 0.25;
    nodes.push({
      id: `genesis-archon-${i}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      address: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      role: "ARCHON",
      isActive: true,
      bandwidth: { up: 30 + Math.random() * 15, down: 60 + Math.random() * 20 },
      latency: 10 + Math.random() * 10,
      stability: 1.0,
    });
    nodeIndex++;
  }

  // BEACON nodes (intermediate layer)
  for (let i = 0; i < roleCounts.BEACON; i++) {
    const angle = (i / roleCounts.BEACON) * Math.PI * 2;
    const radius = 0.35 + (Math.random() - 0.5) * 0.1;
    nodes.push({
      id: `genesis-beacon-${i}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      address: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      role: "BEACON",
      isActive: true,
      bandwidth: { up: 15 + Math.random() * 10, down: 30 + Math.random() * 15 },
      latency: 15 + Math.random() * 15,
      stability: 1.0,
    });
    nodeIndex++;
  }

  // RELAY nodes (outer layer)
  for (let i = 0; i < roleCounts.RELAY; i++) {
    const angle = (i / roleCounts.RELAY) * Math.PI * 2;
    const radius = 0.45 + (Math.random() - 0.5) * 0.1;
    nodes.push({
      id: `genesis-relay-${i}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      address: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      role: "RELAY",
      isActive: true,
      bandwidth: { up: 5 + Math.random() * 5, down: 10 + Math.random() * 10 },
      latency: 20 + Math.random() * 20,
      stability: 1.0,
    });
    nodeIndex++;
  }

  // Generate edges (hierarchical connections)
  // GATE nodes connect to ARCHON nodes
  nodes.filter((n) => n.role === "GATE").forEach((gate) => {
    nodes.filter((n) => n.role === "ARCHON").forEach((archon) => {
      edges.push({
        from: gate.id,
        to: archon.id,
        strength: 0.9,
        active: true,
        latency: 5 + Math.random() * 5,
        bandwidth: 50,
      });
    });
  });

  // ARCHON nodes connect to BEACON nodes
  nodes.filter((n) => n.role === "ARCHON").forEach((archon) => {
    const beacons = nodes.filter((n) => n.role === "BEACON");
    const connections = Math.min(3, beacons.length);
    for (let i = 0; i < connections; i++) {
      const beacon = beacons[Math.floor(Math.random() * beacons.length)];
      if (!edges.find((e) => e.from === archon.id && e.to === beacon.id)) {
        edges.push({
          from: archon.id,
          to: beacon.id,
          strength: 0.7,
          active: true,
          latency: 10 + Math.random() * 10,
          bandwidth: 30,
        });
      }
    }
  });

  // BEACON nodes connect to RELAY nodes
  nodes.filter((n) => n.role === "BEACON").forEach((beacon) => {
    const relays = nodes.filter((n) => n.role === "RELAY");
    const connections = Math.min(4, relays.length);
    for (let i = 0; i < connections; i++) {
      const relay = relays[Math.floor(Math.random() * relays.length)];
      if (!edges.find((e) => e.from === beacon.id && e.to === relay.id)) {
        edges.push({
          from: beacon.id,
          to: relay.id,
          strength: 0.5,
          active: true,
          latency: 15 + Math.random() * 15,
          bandwidth: 15,
        });
      }
    }
  });

  // Some cross-connections for resilience
  for (let i = 0; i < nodeCount * 0.1; i++) {
    const from = nodes[Math.floor(Math.random() * nodes.length)];
    const to = nodes[Math.floor(Math.random() * nodes.length)];
    if (from.id !== to.id && !edges.find((e) => e.from === from.id && e.to === to.id)) {
      edges.push({
        from: from.id,
        to: to.id,
        strength: 0.3,
        active: true,
        latency: 20 + Math.random() * 20,
        bandwidth: 10,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Apply phase effects to network state.
 */
function applyPhaseEffects(
  state: GenesisFabricState,
  phase: GenesisPhase,
  phaseProgress: number // 0.0 - 1.0
): GenesisFabricState {
  const newState = { ...state, phase };

  switch (phase) {
    case "stable":
      // All nodes stable, low latency
      newState.nodes = state.nodes.map((node) => ({
        ...node,
        isActive: true,
        latency: node.role === "GATE" ? 5 : node.role === "ARCHON" ? 10 : node.role === "BEACON" ? 15 : 20,
        stability: 1.0,
      }));
      newState.edges = state.edges.map((edge) => ({
        ...edge,
        active: true,
        latency: edge.latency * 0.8, // Reduced latency
      }));
      newState.anomalies = [];
      break;

    case "incursion":
      // Latency spikes, some anomalies
      newState.nodes = state.nodes.map((node, idx) => {
        const isAffected = idx % 3 === 0; // ~33% affected
        return {
          ...node,
          isActive: true,
          latency: isAffected
            ? node.latency * (2 + phaseProgress * 2) // Increasing latency
            : node.latency * (1 + phaseProgress * 0.5),
          stability: isAffected ? 1.0 - phaseProgress * 0.5 : 1.0,
        };
      });
      newState.edges = state.edges.map((edge) => ({
        ...edge,
        active: true,
        latency: edge.latency * (1.5 + phaseProgress),
      }));
      newState.anomalies = state.nodes.filter((_, idx) => idx % 3 === 0).map((n) => n.id);
      break;

    case "fracture":
      // Partition, some nodes offline
      const partitionPoint = Math.floor(state.nodes.length * 0.6);
      newState.nodes = state.nodes.map((node, idx) => {
        const isPartitioned = idx >= partitionPoint;
        return {
          ...node,
          isActive: !isPartitioned || Math.random() > phaseProgress * 0.7, // Gradually go offline
          latency: isPartitioned ? node.latency * (3 + phaseProgress * 2) : node.latency * 1.5,
          stability: isPartitioned ? 0.3 - phaseProgress * 0.2 : 0.7,
        };
      });
      newState.edges = state.edges.map((edge) => {
        const fromNode = state.nodes.find((n) => n.id === edge.from);
        const toNode = state.nodes.find((n) => n.id === edge.to);
        const isPartitioned = fromNode && toNode && (fromNode.stability < 0.5 || toNode.stability < 0.5);
        return {
          ...edge,
          active: !isPartitioned && Math.random() > phaseProgress * 0.5,
          latency: edge.latency * (2 + phaseProgress * 2),
        };
      });
      newState.anomalies = state.nodes.filter((n) => !n.isActive || n.stability < 0.5).map((n) => n.id);
      break;

    case "rebinding":
      // Recovery with new topology
      newState.nodes = state.nodes.map((node) => ({
        ...node,
        isActive: true,
        latency: node.latency * (1.2 - phaseProgress * 0.4), // Recovering
        stability: Math.min(1.0, 0.5 + phaseProgress * 0.5), // Recovering
      }));
      newState.edges = state.edges.map((edge) => ({
        ...edge,
        active: true,
        latency: edge.latency * (1.5 - phaseProgress * 0.7), // Recovering
      }));
      // Add some new connections (rebinding)
      if (phaseProgress > 0.5) {
        const newEdges = state.nodes
          .filter((n) => n.stability > 0.7)
          .slice(0, Math.floor(state.nodes.length * 0.1))
          .map((node) => {
            const target = state.nodes[Math.floor(Math.random() * state.nodes.length)];
            if (node.id !== target.id && !newState.edges.find((e) => e.from === node.id && e.to === target.id)) {
              return {
                from: node.id,
                to: target.id,
                strength: 0.4,
                active: true,
                latency: 15 + Math.random() * 10,
                bandwidth: 20,
              };
            }
            return null;
          })
          .filter((e): e is GenesisEdge => e !== null);
        newState.edges = [...newState.edges, ...newEdges];
      }
      newState.anomalies = state.nodes.filter((n) => n.stability < 0.8).map((n) => n.id);
      break;
  }

  return newState;
}

export class GenesisFabricService {
  private state: GenesisFabricState;
  private phaseTimer: NodeJS.Timeout | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private onStateChange?: (state: GenesisFabricState) => void;
  private onPhaseChange?: (phase: GenesisPhase) => void;
  private onEvent?: (event: { type: string; title: string; description: string; metadata?: any }) => void;

  constructor() {
    const { nodes, edges } = generateInitialTopology();
    this.state = {
      nodes,
      edges,
      phase: "stable",
      phaseStartTime: Date.now(),
      anomalies: [],
    };
  }

  /**
   * Start the Genesis sequence.
   */
  start(onStateChange?: (state: GenesisFabricState) => void, onPhaseChange?: (phase: GenesisPhase) => void, onEvent?: (event: any) => void) {
    this.onStateChange = onStateChange;
    this.onPhaseChange = onPhaseChange;
    this.onEvent = onEvent;

    // Start in stable phase
    this.transitionToPhase("stable");

    // Begin phase progression
    this.schedulePhaseTransition("incursion", GENESIS_CONFIG.phases.stable.duration);
  }

  /**
   * Transition to a new phase.
   */
  private transitionToPhase(phase: GenesisPhase) {
    const previousPhase = this.state.phase;
    this.state.phase = phase;
    this.state.phaseStartTime = Date.now();

    this.onPhaseChange?.(phase);

    // Emit phase change event
    this.onEvent?.({
      type: "genesis_phase_change",
      title: `Genesis Phase: ${phase.toUpperCase()}`,
      description: `Network transitioned to ${phase} phase`,
      metadata: { phase, previousPhase, timestamp: Date.now() },
    });

    // Schedule next phase
    const phaseDurations: Record<GenesisPhase, number> = {
      stable: GENESIS_CONFIG.phases.stable.duration,
      incursion: GENESIS_CONFIG.phases.incursion.duration,
      fracture: GENESIS_CONFIG.phases.fracture.duration,
      rebinding: GENESIS_CONFIG.phases.rebinding.duration,
    };

    const nextPhase: GenesisPhase | null =
      phase === "stable"
        ? "incursion"
        : phase === "incursion"
        ? "fracture"
        : phase === "fracture"
        ? "rebinding"
        : null;

    if (nextPhase) {
      this.schedulePhaseTransition(nextPhase, phaseDurations[phase]);
    }

    // Start update loop for this phase
    this.startUpdateLoop();
  }

  /**
   * Schedule a phase transition.
   */
  private schedulePhaseTransition(phase: GenesisPhase, delay: number) {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
    }
    this.phaseTimer = setTimeout(() => {
      this.transitionToPhase(phase);
    }, delay);
  }

  /**
   * Start update loop for current phase.
   */
  private startUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      const elapsed = Date.now() - this.state.phaseStartTime;
      const phaseDuration = GENESIS_CONFIG.phases[this.state.phase].duration;
      const progress = Math.min(1.0, elapsed / phaseDuration);

      const newState = applyPhaseEffects(this.state, this.state.phase, progress);
      this.state = newState;
      this.onStateChange?.(this.state);

      // Emit anomaly events periodically
      if (this.state.anomalies.length > 0 && Math.random() < 0.1) {
        const anomalyNode = this.state.nodes.find((n) => this.state.anomalies.includes(n.id));
        if (anomalyNode) {
          this.onEvent?.({
            type: "anomaly",
            title: `Network Anomaly: ${anomalyNode.role} Node ${anomalyNode.id}`,
            description: `High latency detected on ${anomalyNode.role} node`,
            metadata: { nodeId: anomalyNode.id, role: anomalyNode.role, latency: anomalyNode.latency },
          });
        }
      }
    }, 1000); // Update every second
  }

  /**
   * Get current state.
   */
  getState(): GenesisFabricState {
    return { ...this.state };
  }

  /**
   * Stop the service.
   */
  stop() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

