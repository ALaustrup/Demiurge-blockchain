"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentOperator, Operator, OperatorRole, hasPermission, canAccessAdvancedConfig } from "@/config/operator";
import { graphqlRequest } from "@/lib/graphql";

interface OperatorContextType {
  operator: Operator | null;
  loading: boolean;
  hasPermission: (action: string) => boolean;
  canAccessAdvancedConfig: () => boolean;
  refreshOperator: () => Promise<void>;
}

const OperatorContext = createContext<OperatorContextType | undefined>(undefined);

export function OperatorContextProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOperator = async () => {
    try {
      // Try to fetch from backend first
      const userId = process.env.NEXT_PUBLIC_CURRENT_USER_ID || "default";
      const query = `
        query GetOperator($id: ID!) {
          operator(id: $id) {
            id
            displayName
            role
            createdAt
            updatedAt
          }
        }
      `;
      try {
        // Suppress error logging for operator query - it's expected to fail if operator doesn't exist
        const data = await graphqlRequest<{ operator: any }>(
          query, 
          { id: userId },
          undefined,
          { suppressErrors: true }
        );
        if (data && data.operator) {
          setOperator({
            id: data.operator.id,
            displayName: data.operator.displayName,
            role: data.operator.role as OperatorRole,
          });
          setLoading(false);
          return;
        }
        // Operator not found (null response) - fall through to config
      } catch (error: any) {
        // Backend operator query not available, operator not found, or GraphQL error
        // This is expected if the GraphQL schema doesn't have the operator query or operator doesn't exist
        // Silently fall back without logging as an error unless it's a connection issue
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes("fetch") || errorMsg.includes("Connection failed") || errorMsg.includes("Failed to fetch")) {
          console.warn("Cannot connect to GraphQL gateway, using config operator");
        }
        // All other errors are silently handled - no logging needed
      }

      // Fall back to config-based operator
      const configOperator = getCurrentOperator();
      setOperator(configOperator);
    } catch (error: any) {
      // Final fallback - use config-based operator
      console.warn("Failed to load operator, using config fallback:", error.message);
      const configOperator = getCurrentOperator();
      setOperator(configOperator);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOperator();
  }, []);

  const checkPermission = (action: string): boolean => {
    if (!operator) return false;
    return hasPermission(operator.role, action);
  };

  const checkAdvancedConfig = (): boolean => {
    if (!operator) return false;
    return canAccessAdvancedConfig(operator.role);
  };

  return (
    <OperatorContext.Provider
      value={{
        operator,
        loading,
        hasPermission: checkPermission,
        canAccessAdvancedConfig: checkAdvancedConfig,
        refreshOperator,
      }}
    >
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (context === undefined) {
    throw new Error("useOperator must be used within OperatorContextProvider");
  }
  return context;
}

