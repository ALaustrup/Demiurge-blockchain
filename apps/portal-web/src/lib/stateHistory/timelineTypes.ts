/**
 * Timeline & Time Travel Types
 * 
 * Defines the structure for system snapshots, events, and timeline navigation.
 */

export type SystemEventType =
  | "system"
  | "ritual"
  | "archon_proposal"
  | "user_action"
  | "fabric"
  | "capsule"
  | "anomaly";

export interface SystemEvent {
  id: string;
  type: SystemEventType;
  source: string; // "ritual_engine" | "archon_ai" | "fabric" | "user" | etc.
  title: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
  relatedSnapshotId?: string; // Link to snapshot if applicable
}

export interface SystemSnapshot {
  id: string;
  timestamp: number;
  label?: string; // Human-readable label
  fabric: {
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
  };
  rituals: Array<{
    id: string;
    name: string;
    phase: string;
    parameters: Record<string, any>;
  }>;
  capsules: Array<{
    id: string;
    projectSlug: string;
    status: string;
    owner: string;
  }>;
  shaderState?: {
    turbulence: number;
    chromaShift: number;
    glitchAmount: number;
    bloomIntensity: number;
    vignetteIntensity: number;
  };
  metadata?: Record<string, any>;
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  type: "event" | "snapshot";
  event?: SystemEvent;
  snapshot?: SystemSnapshot;
}

export interface TimelineFilters {
  type?: SystemEventType[];
  source?: string[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}

