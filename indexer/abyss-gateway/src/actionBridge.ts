/**
 * Action Bridge Service
 * 
 * Exposes discrete, safe operations that can be called by ArchonAI proposals or operators.
 * Actions update internal DB tables, emit system_events, and optionally stub calls to external systems.
 */

import { getDb, createSystemEvent } from "./chatDb";

export type ActionType = 
  | "tag_node"
  | "mark_node_degraded"
  | "create_incident_note"
  | "update_node_status"
  | "create_maintenance_window";

export interface Action {
  type: ActionType;
  parameters: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  actionId: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Tag a node with a label/tag.
 */
export function tagNode(nodeId: string, tag: string, operatorId?: string): ActionResult {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // For now, store in system_events metadata
    // In production, could have a dedicated node_tags table
    const eventId = `sys_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    createSystemEvent(
      eventId,
      "node_action",
      operatorId || "system",
      `Node Tagged: ${nodeId}`,
      `Node ${nodeId} tagged with: ${tag}`,
      JSON.stringify({ nodeId, tag, actionId, type: "tag_node" })
    );

    // TODO: In production, could call external Fabric API to tag node
    // await fabricApi.tagNode(nodeId, tag);

    return {
      success: true,
      actionId,
      message: `Node ${nodeId} tagged with ${tag}`,
      metadata: { nodeId, tag },
    };
  } catch (error: any) {
    return {
      success: false,
      actionId,
      message: `Failed to tag node: ${error.message}`,
    };
  }
}

/**
 * Mark a node as degraded with a reason.
 */
export function markNodeDegraded(nodeId: string, reason: string, operatorId?: string): ActionResult {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const eventId = `sys_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    createSystemEvent(
      eventId,
      "node_action",
      operatorId || "system",
      `Node Degraded: ${nodeId}`,
      `Node ${nodeId} marked as degraded: ${reason}`,
      JSON.stringify({ nodeId, reason, actionId, type: "mark_node_degraded", severity: "high" })
    );

    // TODO: In production, could call external Fabric API to mark node degraded
    // await fabricApi.markNodeDegraded(nodeId, reason);

    return {
      success: true,
      actionId,
      message: `Node ${nodeId} marked as degraded`,
      metadata: { nodeId, reason },
    };
  } catch (error: any) {
    return {
      success: false,
      actionId,
      message: `Failed to mark node degraded: ${error.message}`,
    };
  }
}

/**
 * Create an incident note.
 */
export function createIncidentNote(message: string, relatedNodeIds?: string[], operatorId?: string): ActionResult {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const eventId = `sys_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    createSystemEvent(
      eventId,
      "incident",
      operatorId || "system",
      "Incident Note Created",
      message,
      JSON.stringify({ relatedNodeIds, actionId, type: "create_incident_note" })
    );

    // TODO: In production, could create entry in incident tracking system
    // await incidentSystem.createNote(message, relatedNodeIds);

    return {
      success: true,
      actionId,
      message: "Incident note created",
      metadata: { message, relatedNodeIds },
    };
  } catch (error: any) {
    return {
      success: false,
      actionId,
      message: `Failed to create incident note: ${error.message}`,
    };
  }
}

/**
 * Update node status.
 */
export function updateNodeStatus(nodeId: string, status: "online" | "offline" | "degraded", operatorId?: string): ActionResult {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const eventId = `sys_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    createSystemEvent(
      eventId,
      "node_action",
      operatorId || "system",
      `Node Status Updated: ${nodeId}`,
      `Node ${nodeId} status changed to ${status}`,
      JSON.stringify({ nodeId, status, actionId, type: "update_node_status" })
    );

    // TODO: In production, could call external Fabric API
    // await fabricApi.updateNodeStatus(nodeId, status);

    return {
      success: true,
      actionId,
      message: `Node ${nodeId} status updated to ${status}`,
      metadata: { nodeId, status },
    };
  } catch (error: any) {
    return {
      success: false,
      actionId,
      message: `Failed to update node status: ${error.message}`,
    };
  }
}

/**
 * Create a maintenance window.
 */
export function createMaintenanceWindow(
  startTime: number,
  endTime: number,
  description: string,
  affectedNodeIds?: string[],
  operatorId?: string
): ActionResult {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const eventId = `sys_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    createSystemEvent(
      eventId,
      "maintenance",
      operatorId || "system",
      "Maintenance Window Created",
      description,
      JSON.stringify({ startTime, endTime, affectedNodeIds, actionId, type: "create_maintenance_window" })
    );

    // TODO: In production, could create entry in maintenance calendar
    // await maintenanceSystem.createWindow(startTime, endTime, description, affectedNodeIds);

    return {
      success: true,
      actionId,
      message: "Maintenance window created",
      metadata: { startTime, endTime, description, affectedNodeIds },
    };
  } catch (error: any) {
    return {
      success: false,
      actionId,
      message: `Failed to create maintenance window: ${error.message}`,
    };
  }
}

/**
 * Execute an action from an Archon proposal.
 */
export function executeAction(action: Action, operatorId?: string): ActionResult {
  switch (action.type) {
    case "tag_node":
      return tagNode(action.parameters.nodeId, action.parameters.tag, operatorId);
    case "mark_node_degraded":
      return markNodeDegraded(action.parameters.nodeId, action.parameters.reason, operatorId);
    case "create_incident_note":
      return createIncidentNote(action.parameters.message, action.parameters.relatedNodeIds, operatorId);
    case "update_node_status":
      return updateNodeStatus(action.parameters.nodeId, action.parameters.status, operatorId);
    case "create_maintenance_window":
      return createMaintenanceWindow(
        action.parameters.startTime,
        action.parameters.endTime,
        action.parameters.description,
        action.parameters.affectedNodeIds,
        operatorId
      );
    default:
      return {
        success: false,
        actionId: `unknown_${Date.now()}`,
        message: `Unknown action type: ${(action as any).type}`,
      };
  }
}

