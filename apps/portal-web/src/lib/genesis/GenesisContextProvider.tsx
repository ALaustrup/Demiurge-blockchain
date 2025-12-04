"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { GenesisFabricService, GenesisFabricState, GenesisPhase } from "./GenesisFabricService";
import { GENESIS_CONFIG } from "@/config/genesis";
import { graphqlRequest } from "@/lib/graphql";

interface GenesisContextType {
  fabricState: GenesisFabricState | null;
  currentPhase: GenesisPhase | null;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

const GenesisContext = createContext<GenesisContextType | undefined>(undefined);

export function GenesisContextProvider({ children }: { children: ReactNode }) {
  const [fabricState, setFabricState] = useState<GenesisFabricState | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GenesisPhase | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const serviceRef = useRef<GenesisFabricService | null>(null);

  useEffect(() => {
    if (!GENESIS_CONFIG.enabled) {
      return;
    }

    // Initialize service
    serviceRef.current = new GenesisFabricService();

    return () => {
      serviceRef.current?.stop();
      serviceRef.current = null;
    };
  }, []);

  const start = () => {
    if (!serviceRef.current || isRunning) return;

    serviceRef.current.start(
      (state) => {
        setFabricState(state);
      },
      (phase) => {
        setCurrentPhase(phase);
      },
      async (event) => {
        // Emit to backend via GraphQL mutation
        try {
          const mutation = `
            mutation CreateSystemEvent($type: String!, $source: String!, $title: String!, $description: String!, $metadata: String) {
              createSystemEvent(type: $type, source: $source, title: $title, description: $description, metadata: $metadata) {
                id
                timestamp
              }
            }
          `;
          await graphqlRequest(mutation, {
            type: event.type,
            source: "genesis_fabric_service",
            title: event.title,
            description: event.description,
            metadata: JSON.stringify({ ...event.metadata, genesis: true }),
          });
        } catch (error) {
          console.warn("Failed to emit Genesis event to backend:", error);
        }
      }
    );

    setIsRunning(true);
  };

  const stop = () => {
    if (serviceRef.current) {
      serviceRef.current.stop();
      setIsRunning(false);
      setCurrentPhase(null);
    }
  };

  return (
    <GenesisContext.Provider
      value={{
        fabricState,
        currentPhase,
        isRunning,
        start,
        stop,
      }}
    >
      {children}
    </GenesisContext.Provider>
  );
}

export function useGenesis() {
  const context = useContext(GenesisContext);
  if (context === undefined) {
    throw new Error("useGenesis must be used within GenesisContextProvider");
  }
  return context;
}

