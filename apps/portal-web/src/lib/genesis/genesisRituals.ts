/**
 * Genesis Ritual Sequence
 * 
 * Defines the ritual sequence that aligns with Genesis Fabric phases.
 */

import { Ritual } from "@/lib/rituals/ritualTypes";

/**
 * Genesis ritual sequence aligned with Fabric phases:
 * - Stable → Incursion → Fracture → Rebinding
 */
export const GENESIS_RITUAL_SEQUENCE: Omit<Ritual, "id" | "phase">[] = [
  {
    name: "Genesis: Stability",
    description: "The network begins in a state of equilibrium. All nodes synchronized, all paths clear.",
    parameters: {
      intensity: 0.5,
      duration: 30000, // 30 seconds
      frequency: 440,
      colorShift: 0.2,
      turbulence: 0.2,
    },
    effects: {
      shaderUniforms: {
        turbulence: 0.2,
        chromaShift: 0.2,
        glitchAmount: 0,
        bloomIntensity: 0.4,
        vignetteIntensity: 0.2,
      },
      fabricVisuals: {
        nodeGlow: true,
        edgePulse: false,
        highlightNodes: [],
      },
    },
  },
  {
    name: "Genesis: Incursion",
    description: "Anomalies emerge. Latency spikes ripple through the network. The first signs of fracture.",
    parameters: {
      intensity: 0.7,
      duration: 25000, // 25 seconds
      frequency: 330,
      colorShift: 0.5,
      turbulence: 0.6,
    },
    effects: {
      shaderUniforms: {
        turbulence: 0.6,
        chromaShift: 0.5,
        glitchAmount: 0.3,
        bloomIntensity: 0.6,
        vignetteIntensity: 0.4,
      },
      fabricVisuals: {
        nodeGlow: true,
        edgePulse: true,
        highlightNodes: [], // Will be set dynamically based on anomalies
      },
    },
  },
  {
    name: "Genesis: Fracture",
    description: "The network partitions. Nodes go dark. Connections sever. The abyss opens.",
    parameters: {
      intensity: 0.9,
      duration: 20000, // 20 seconds
      frequency: 220,
      colorShift: 0.8,
      turbulence: 0.9,
    },
    effects: {
      shaderUniforms: {
        turbulence: 0.9,
        chromaShift: 0.8,
        glitchAmount: 0.6,
        bloomIntensity: 0.3,
        vignetteIntensity: 0.8,
      },
      fabricVisuals: {
        nodeGlow: false,
        edgePulse: true,
        highlightNodes: [], // Will be set dynamically based on offline nodes
      },
    },
  },
  {
    name: "Genesis: Rebinding",
    description: "Recovery begins. New connections form. The network rebinds itself, stronger than before.",
    parameters: {
      intensity: 0.6,
      duration: 30000, // 30 seconds
      frequency: 550,
      colorShift: 0.4,
      turbulence: 0.3,
    },
    effects: {
      shaderUniforms: {
        turbulence: 0.3,
        chromaShift: 0.4,
        glitchAmount: 0.1,
        bloomIntensity: 0.8,
        vignetteIntensity: 0.3,
      },
      fabricVisuals: {
        nodeGlow: true,
        edgePulse: true,
        highlightNodes: [], // Will highlight newly formed connections
      },
    },
  },
];

