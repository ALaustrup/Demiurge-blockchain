"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { RitualEngine, RitualEngineCallbacks } from "./RitualEngine";
import { Ritual, RitualPhase, RitualEvent, RitualEffects } from "./ritualTypes";

export interface FabricRitualEffects {
  nodeGlow?: boolean;
  edgePulse?: boolean;
  highlightNodes?: string[];
  pulseSpeed?: number;
  glowIntensity?: number;
  colorTheme?: "default" | "ritual" | "void";
}

interface RitualContextType {
  currentRitual: Ritual | null;
  engine: RitualEngine | null;
  startRitual: (ritual: Ritual) => Promise<void>;
  abortRitual: () => void;
  updateParameters: (parameters: Partial<Ritual["parameters"]>) => void;
  updateEffects: (effects: Partial<RitualEffects>) => void;
  effects: RitualEffects | null;
  fabricRitualEffects: FabricRitualEffects | null;
}

const RitualContext = createContext<RitualContextType | undefined>(undefined);

export function RitualContextProvider({ children }: { children: ReactNode }) {
  const [currentRitual, setCurrentRitual] = useState<Ritual | null>(null);
  const [effects, setEffects] = useState<RitualEffects | null>(null);
  const engineRef = useRef<RitualEngine | null>(null);

  useEffect(() => {
    const callbacks: RitualEngineCallbacks = {
      onPhaseChange: (ritual, previousPhase) => {
        setCurrentRitual({ ...ritual });
      },
      onEvent: (event) => {
        // Could emit to backend here
        console.debug("Ritual event:", event);
      },
      onEffectsUpdate: (newEffects) => {
        setEffects(newEffects);
      },
    };

    engineRef.current = new RitualEngine(callbacks);

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const startRitual = useCallback(async (ritual: Ritual) => {
    if (engineRef.current) {
      await engineRef.current.startRitual(ritual);
      setCurrentRitual(engineRef.current.getCurrentRitual());
    }
  }, []);

  const abortRitual = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.abortRitual();
      setCurrentRitual(engineRef.current.getCurrentRitual());
    }
  }, []);

  const updateParameters = useCallback((parameters: Partial<Ritual["parameters"]>) => {
    if (engineRef.current) {
      engineRef.current.updateParameters(parameters);
      setCurrentRitual(engineRef.current.getCurrentRitual());
    }
  }, []);

  const updateEffects = useCallback((effects: Partial<RitualEffects>) => {
    if (engineRef.current) {
      engineRef.current.updateEffects(effects);
    }
  }, []);

  // Derive fabric ritual effects from current ritual
  const fabricRitualEffects: FabricRitualEffects | null = currentRitual?.effects?.fabricVisuals
    ? {
        nodeGlow: currentRitual.effects.fabricVisuals.nodeGlow ?? false,
        edgePulse: currentRitual.effects.fabricVisuals.edgePulse ?? false,
        highlightNodes: currentRitual.effects.fabricVisuals.highlightNodes ?? [],
        pulseSpeed: currentRitual.parameters.intensity ? 1.0 + currentRitual.parameters.intensity * 0.5 : 1.0,
        glowIntensity: currentRitual.parameters.intensity ?? 0.0,
        colorTheme: currentRitual.name.toLowerCase().includes("void") ? "void" : "ritual",
      }
    : null;

  return (
    <RitualContext.Provider
      value={{
        currentRitual,
        engine: engineRef.current,
        startRitual,
        abortRitual,
        updateParameters,
        updateEffects,
        effects,
        fabricRitualEffects,
      }}
    >
      {children}
    </RitualContext.Provider>
  );
}

export function useRitual() {
  const context = useContext(RitualContext);
  if (context === undefined) {
    throw new Error("useRitual must be used within RitualContextProvider");
  }
  return context;
}

