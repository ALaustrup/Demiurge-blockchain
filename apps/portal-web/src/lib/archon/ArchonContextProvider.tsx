"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { ArchonProposal, ArchonContext, ArchonProposalStatus } from "./archonTypes";
import { graphqlRequest } from "@/lib/graphql";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";

interface ArchonContextType {
  proposals: ArchonProposal[];
  context: ArchonContext | null;
  loading: boolean;
  error: string | null;
  fetchProposals: (status?: ArchonProposalStatus) => Promise<void>;
  fetchContext: () => Promise<void>;
  reviewProposal: (id: string, status: "approved" | "rejected") => Promise<void>;
  applyProposal: (id: string) => Promise<void>;
}

const ArchonContext = createContext<ArchonContextType | undefined>(undefined);

export function ArchonContextProvider({ children }: { children: ReactNode }) {
  const { identity } = useAbyssID();
  const [proposals, setProposals] = useState<ArchonProposal[]>([]);
  const [context, setContext] = useState<ArchonContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent unnecessary re-renders and track in-flight requests
  const proposalsRef = useRef<ArchonProposal[]>([]);
  const contextRef = useRef<ArchonContext | null>(null);
  const fetchingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProposals = useCallback(async (status?: ArchonProposalStatus) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    
    setLoading(true);
    setError(null);
    fetchingRef.current = true;
    
    try {
      const query = `
        query GetArchonProposals($status: String, $limit: Int) {
          archonProposals(status: $status, limit: $limit) {
            id
            title
            rationale
            predictedImpact
            actions
            status
            createdAt
            reviewedAt
            reviewedBy
            appliedAt
            failureReason
          }
        }
      `;
      const data = await graphqlRequest<{ archonProposals: any[] }>(query, { status, limit: 50 });
      const parsed = data.archonProposals.map((p: any) => {
        try {
          return {
            ...p,
            predictedImpact: p.predictedImpact ? JSON.parse(p.predictedImpact) : {},
            actions: p.actions ? JSON.parse(p.actions) : [],
          };
        } catch (parseError) {
          console.warn(`Failed to parse proposal ${p.id}:`, parseError);
          return {
            ...p,
            predictedImpact: {},
            actions: [],
          };
        }
      });
      
      // Only update state if data actually changed (prevent unnecessary re-renders)
      const proposalsChanged = JSON.stringify(parsed) !== JSON.stringify(proposalsRef.current);
      if (proposalsChanged) {
        proposalsRef.current = parsed;
        setProposals(parsed);
      }
    } catch (err: any) {
      // Don't break UI on backend errors - just log and show error state
      const errorMessage = err.message || "Failed to fetch proposals";
      setError(errorMessage);
      console.error("Failed to fetch ArchonAI proposals:", err);
      // Keep previous proposals on error
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  const fetchContext = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    
    setLoading(true);
    setError(null);
    fetchingRef.current = true;
    
    try {
      const query = `
        query GetArchonContext {
          archonContext
        }
      `;
      const data = await graphqlRequest<{ archonContext: string }>(query);
      const parsedContext = JSON.parse(data.archonContext);
      
      // Only update state if data actually changed (prevent unnecessary re-renders)
      const contextChanged = JSON.stringify(parsedContext) !== JSON.stringify(contextRef.current);
      if (contextChanged) {
        contextRef.current = parsedContext;
        setContext(parsedContext);
      }
    } catch (err: any) {
      // Don't break UI on backend errors - just log and show error state
      const errorMessage = err.message || "Failed to fetch context";
      setError(errorMessage);
      console.error("Failed to fetch ArchonAI context:", err);
      // Keep previous context on error
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  const reviewProposal = useCallback(async (id: string, status: "approved" | "rejected") => {
    setLoading(true);
    setError(null);
    try {
      const mutation = `
        mutation ReviewArchonProposal($id: ID!, $status: String!) {
          reviewArchonProposal(id: $id, status: $status) {
            id
            status
            reviewedAt
            reviewedBy
          }
        }
      `;
      await graphqlRequest(mutation, { id, status });
      await fetchProposals();
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to review proposal:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchProposals]);

  const applyProposal = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const mutation = `
        mutation ApplyArchonProposal($id: ID!) {
          applyArchonProposal(id: $id) {
            id
            status
            appliedAt
          }
        }
      `;
      await graphqlRequest(mutation, { id });
      await fetchProposals();
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to apply proposal:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchProposals]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    // Initial fetch
    fetchProposals().catch(() => {
      // Error already handled in fetchProposals
    });
    fetchContext().catch(() => {
      // Error already handled in fetchContext
    });
    
    // Refresh periodically (only if not already fetching)
    intervalRef.current = setInterval(() => {
      if (!fetchingRef.current) {
        fetchProposals().catch(() => {});
        fetchContext().catch(() => {});
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchProposals, fetchContext]);

  return (
    <ArchonContext.Provider
      value={{
        proposals,
        context,
        loading,
        error,
        fetchProposals,
        fetchContext,
        reviewProposal,
        applyProposal,
      }}
    >
      {children}
    </ArchonContext.Provider>
  );
}

export function useArchon() {
  const context = useContext(ArchonContext);
  if (context === undefined) {
    throw new Error("useArchon must be used within ArchonContextProvider");
  }
  return context;
}

