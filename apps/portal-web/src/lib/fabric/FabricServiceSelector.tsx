"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { FABRIC_CONFIG, FabricMode } from "@/config/fabric";
import { GenesisFabricService, GenesisFabricState } from "@/lib/genesis/GenesisFabricService";
import { RealFabricService, FabricNode, FabricEdge } from "@/lib/fabric/RealFabricService";
import { GENESIS_CONFIG } from "@/config/genesis";

interface FabricServiceState {
  nodes: FabricNode[];
  edges: FabricEdge[];
  phase?: string; // Genesis phase, if applicable
  loading: boolean;
  error: string | null;
}

interface FabricServiceContextType {
  state: FabricServiceState;
  isGenesis: boolean;
  isReal: boolean;
}

const FabricServiceContext = createContext<FabricServiceContextType | undefined>(undefined);

export function FabricServiceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FabricServiceState>({
    nodes: [],
    edges: [],
    loading: true,
    error: null,
  });

  const genesisServiceRef = useRef<GenesisFabricService | null>(null);
  const realServiceRef = useRef<RealFabricService | null>(null);

  useEffect(() => {
    // Determine which service to use
    const isGenesis = FABRIC_CONFIG.mode === "genesis" && GENESIS_CONFIG.enabled;
    const isReal = FABRIC_CONFIG.mode.startsWith("real-");

    if (isGenesis) {
      // Use Genesis Fabric Service
      genesisServiceRef.current = new GenesisFabricService();
      
      genesisServiceRef.current.start(
        (genesisState: GenesisFabricState) => {
          // Convert Genesis nodes/edges to FabricNode/FabricEdge format
          const nodes: FabricNode[] = genesisState.nodes.map((n) => ({
            id: n.id,
            x: n.x,
            y: n.y,
            address: n.address,
            role: n.role,
            isActive: n.isActive,
            bandwidth: n.bandwidth,
            latency: n.latency,
            stability: n.stability,
          }));
          const edges: FabricEdge[] = genesisState.edges.map((e) => ({
            from: e.from,
            to: e.to,
            strength: e.strength,
            active: e.active,
            latency: e.latency,
            bandwidth: e.bandwidth,
          }));

          setState({
            nodes,
            edges,
            phase: genesisState.phase,
            loading: false,
            error: null,
          });
        },
        (phase: string) => {
          setState((prev) => ({ ...prev, phase }));
        },
        (event) => {
          // Events handled by GenesisContextProvider
        }
      );
    } else if (isReal) {
      // Use Real Fabric Service
      const mode = FABRIC_CONFIG.mode as "real-devnet" | "real-prod";
      realServiceRef.current = new RealFabricService(mode);

      realServiceRef.current.start(
        (nodes: FabricNode[], edges: FabricEdge[]) => {
          setState({
            nodes,
            edges,
            loading: false,
            error: null,
          });
        },
        (error: Error) => {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
        }
      );
    } else {
      // No fabric service (fallback to empty state)
      setState({
        nodes: [],
        edges: [],
        loading: false,
        error: "No fabric service configured",
      });
    }

    return () => {
      genesisServiceRef.current?.stop();
      realServiceRef.current?.stop();
    };
  }, []);

  const isGenesis = FABRIC_CONFIG.mode === "genesis" && GENESIS_CONFIG.enabled;
  const isReal = FABRIC_CONFIG.mode.startsWith("real-");

  return (
    <FabricServiceContext.Provider
      value={{
        state,
        isGenesis,
        isReal,
      }}
    >
      {children}
    </FabricServiceContext.Provider>
  );
}

export function useFabricService() {
  const context = useContext(FabricServiceContext);
  if (context === undefined) {
    throw new Error("useFabricService must be used within FabricServiceProvider");
  }
  return context;
}

