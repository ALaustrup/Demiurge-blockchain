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
        const data = await graphqlRequest<{ operator: any }>(query, { id: userId });
        if (data.operator) {
          setOperator({
            id: data.operator.id,
            displayName: data.operator.displayName,
            role: data.operator.role as OperatorRole,
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        // Backend operator not found, fall back to config
        console.warn("Operator not found in backend, using config:", error);
      }

      // Fall back to config-based operator
      const configOperator = getCurrentOperator();
      setOperator(configOperator);
    } catch (error) {
      console.error("Failed to load operator:", error);
      // Fall back to config
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

