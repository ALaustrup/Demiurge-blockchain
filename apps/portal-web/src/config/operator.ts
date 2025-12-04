/**
 * Operator Roles & User Configuration
 * 
 * Defines user roles and current user for role-based access control.
 */

export type OperatorRole = "OBSERVER" | "OPERATOR" | "ARCHITECT";

export interface Operator {
  id: string;
  displayName: string;
  role: OperatorRole;
}

/**
 * Get current user from environment or config.
 * For now, uses environment variable or defaults to OBSERVER.
 */
export function getCurrentOperator(): Operator {
  const userId = process.env.NEXT_PUBLIC_CURRENT_USER_ID || "default";
  const userRole = (process.env.NEXT_PUBLIC_CURRENT_USER_ROLE as OperatorRole) || "OBSERVER";
  const displayName = process.env.NEXT_PUBLIC_CURRENT_USER_NAME || "Observer";

  return {
    id: userId,
    displayName,
    role: userRole,
  };
}

/**
 * Check if role has permission for action.
 */
export function hasPermission(role: OperatorRole, action: string): boolean {
  switch (role) {
    case "ARCHITECT":
      return true; // All permissions
    case "OPERATOR":
      return [
        "start_ritual",
        "stop_ritual",
        "apply_proposal",
        "export_session",
      ].includes(action);
    case "OBSERVER":
      return false; // Read-only
    default:
      return false;
  }
}

/**
 * Check if role can access advanced configuration.
 */
export function canAccessAdvancedConfig(role: OperatorRole): boolean {
  return role === "ARCHITECT";
}

