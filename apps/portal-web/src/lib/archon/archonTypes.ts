/**
 * ArchonAI Autonomy Layer Types
 * 
 * Defines the structure for ArchonAI proposals, actions, and context.
 */

export type ArchonProposalStatus = 
  | "pending"
  | "approved"
  | "rejected"
  | "applied"
  | "failed";

export type ArchonActionType =
  | "ritual_start"
  | "ritual_stop"
  | "ritual_modify"
  | "fabric_node_highlight"
  | "fabric_node_isolate"
  | "capsule_status_change"
  | "system_config_change"
  | "custom";

export interface ArchonAction {
  type: ArchonActionType;
  target?: string; // ID of target entity
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ArchonProposal {
  id: string;
  title: string;
  rationale: string;
  predictedImpact: {
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    affectedSystems: string[];
  };
  actions: ArchonAction[];
  status: ArchonProposalStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string; // user address
  appliedAt?: number;
  failureReason?: string;
}

export interface ArchonContext {
  fabric: {
    nodeCount: number;
    edgeCount: number;
    activeNodes: number;
    averageLatency: number;
    unstableNodes: string[];
  };
  rituals: {
    active: number;
    recent: Array<{ id: string; name: string; phase: string }>;
  };
  capsules: {
    total: number;
    active: number;
    byStatus: Record<string, number>;
  };
  events: {
    recent: number;
    anomalies: number;
  };
  timestamp: number;
}

