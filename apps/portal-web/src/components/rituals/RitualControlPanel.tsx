"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRitual } from "@/lib/rituals/RitualContextProvider";
import { Ritual, RitualPhase } from "@/lib/rituals/ritualTypes";
import { Sparkles, Zap, X, Play, Square, PlayCircle } from "lucide-react";
import { GENESIS_CONFIG } from "@/config/genesis";
import { GENESIS_RITUAL_SEQUENCE } from "@/lib/genesis/genesisRituals";
import { useGenesis } from "@/lib/genesis/GenesisContextProvider";
import { useOperator } from "@/lib/operator/OperatorContextProvider";

/**
 * Predefined ritual templates.
 */
const RITUAL_TEMPLATES: Omit<Ritual, "id" | "phase">[] = [
  {
    name: "Abyss Binding",
    description: "A foundational ritual for identity creation and binding.",
    parameters: {
      intensity: 0.7,
      duration: 10000,
      frequency: 440,
      colorShift: 0.3,
      turbulence: 0.5,
    },
    effects: {
      shaderUniforms: {
        turbulence: 0.5,
        chromaShift: 0.3,
        glitchAmount: 0.2,
        bloomIntensity: 0.6,
        vignetteIntensity: 0.4,
      },
      fabricVisuals: {
        nodeGlow: true,
        edgePulse: false,
      },
    },
  },
  {
    name: "Fabric Resonance",
    description: "Amplifies P2P network visualization and connectivity.",
    parameters: {
      intensity: 0.8,
      duration: 15000,
      frequency: 220,
      colorShift: 0.5,
      turbulence: 0.3,
    },
    effects: {
      shaderUniforms: {
        turbulence: 0.3,
        chromaShift: 0.5,
        glitchAmount: 0.1,
        bloomIntensity: 0.8,
        vignetteIntensity: 0.2,
      },
      fabricVisuals: {
        nodeGlow: true,
        edgePulse: true,
        highlightNodes: [],
      },
    },
  },
  {
    name: "Void Convergence",
    description: "Developer-focused ritual enhancing Dev Capsule visibility.",
    parameters: {
      intensity: 0.9,
      duration: 12000,
      frequency: 880,
      colorShift: 0.7,
      turbulence: 0.6,
    },
    effects: {
      shaderUniforms: {
        turbulence: 0.6,
        chromaShift: 0.7,
        glitchAmount: 0.3,
        bloomIntensity: 0.9,
        vignetteIntensity: 0.5,
      },
      fabricVisuals: {
        nodeGlow: false,
        edgePulse: true,
      },
    },
  },
];

const PHASE_COLORS: Record<RitualPhase, string> = {
  idle: "text-gray-400",
  initiating: "text-blue-400",
  active: "text-green-400",
  peaking: "text-yellow-400",
  dissolving: "text-purple-400",
  completed: "text-gray-500",
  aborted: "text-red-400",
};

export function RitualControlPanel() {
  const { currentRitual, startRitual, abortRitual, effects } = useRitual();
  const { hasPermission } = useOperator();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [genesisSequenceRunning, setGenesisSequenceRunning] = useState(false);
  const genesisSequenceRef = useRef<{ index: number; timeout?: NodeJS.Timeout } | null>(null);
  
  // Only access Genesis context if Genesis mode is enabled
  let genesisContext: ReturnType<typeof useGenesis> | null = null;
  try {
    if (GENESIS_CONFIG.enabled) {
      genesisContext = useGenesis();
    }
  } catch {
    // Genesis context not available (not in provider tree or mode disabled)
  }
  
  const canStartRitual = hasPermission("start_ritual");
  const canStopRitual = hasPermission("stop_ritual");

  const handleStartRitual = async (template: Omit<Ritual, "id" | "phase">) => {
    if (!canStartRitual) {
      alert("Requires OPERATOR role to start rituals");
      return;
    }
    const ritual: Ritual = {
      ...template,
      id: `ritual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phase: "idle",
    };
    await startRitual(ritual);
  };

  const handleAbort = () => {
    if (!canStopRitual) {
      alert("Requires OPERATOR role to stop rituals");
      return;
    }
    abortRitual();
  };

  const handleRunGenesisSequence = async () => {
    if (genesisSequenceRunning || !genesisContext) return;

    setGenesisSequenceRunning(true);
    genesisContext.start();

    // Start the ritual sequence
    let currentIndex = 0;

    const runNextRitual = async () => {
      if (currentIndex >= GENESIS_RITUAL_SEQUENCE.length) {
        setGenesisSequenceRunning(false);
        genesisSequenceRef.current = null;
        return;
      }

      const ritualTemplate = GENESIS_RITUAL_SEQUENCE[currentIndex];
      
      // Update fabric visuals based on current Genesis phase
      if (genesisContext?.fabricState) {
        const anomalies = genesisContext.fabricState.anomalies;
        const offlineNodes = genesisContext.fabricState.nodes
          .filter((n) => !n.isActive)
          .map((n) => n.id);
        
        ritualTemplate.effects.fabricVisuals = {
          ...ritualTemplate.effects.fabricVisuals,
          highlightNodes: [...anomalies, ...offlineNodes],
        };
      }

      const ritual: Ritual = {
        ...ritualTemplate,
        id: `genesis_ritual_${currentIndex}_${Date.now()}`,
        phase: "idle",
      };

      await startRitual(ritual);

      // Schedule next ritual
      const duration = ritualTemplate.parameters.duration || 30000;
      const timeout = setTimeout(() => {
        currentIndex++;
        runNextRitual();
      }, duration);

      genesisSequenceRef.current = { index: currentIndex, timeout };
    };

    await runNextRitual();
  };

  const handleStopGenesisSequence = () => {
    if (genesisSequenceRef.current?.timeout) {
      clearTimeout(genesisSequenceRef.current.timeout);
    }
    genesisSequenceRef.current = null;
    setGenesisSequenceRunning(false);
    abortRitual();
    if (genesisContext) {
      genesisContext.stop();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (genesisSequenceRef.current?.timeout) {
        clearTimeout(genesisSequenceRef.current.timeout);
      }
    };
  }, []);

  return (
    <div className="glass-dark rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-oswald text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Ritual Engine
        </h3>
        {currentRitual && (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${PHASE_COLORS[currentRitual.phase]}`}>
              {currentRitual.phase.toUpperCase()}
            </span>
            <button
              onClick={handleAbort}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Abort ritual"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {currentRitual ? (
        <div className="space-y-3">
          <div>
            <h4 className="text-lg font-oswald text-white mb-1">{currentRitual.name}</h4>
            <p className="text-sm text-gray-300">{currentRitual.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Intensity:</span>
              <span className="text-white ml-1">{currentRitual.parameters.intensity?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">Duration:</span>
              <span className="text-white ml-1">{((currentRitual.parameters.duration || 0) / 1000).toFixed(1)}s</span>
            </div>
          </div>

          {effects?.shaderUniforms && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-gray-400 mb-1">Active Effects:</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(effects.shaderUniforms).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-white">{typeof value === "number" ? value.toFixed(2) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {GENESIS_CONFIG.enabled && genesisContext && (
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-oswald text-white">Genesis Sequence</h4>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Run the complete Genesis ritual sequence aligned with network phases.
              </p>
              {genesisSequenceRunning ? (
                <motion.button
                  onClick={handleStopGenesisSequence}
                  className="w-full px-3 py-2 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Square className="w-4 h-4" />
                  Stop Genesis Sequence
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleRunGenesisSequence}
                  className="w-full px-3 py-2 rounded bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 text-purple-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PlayCircle className="w-4 h-4" />
                  Run Genesis Sequence
                </motion.button>
              )}
              {genesisContext.currentPhase && (
                <div className="mt-2 text-xs text-purple-400">
                  Fabric Phase: <span className="font-medium">{genesisContext.currentPhase.toUpperCase()}</span>
                </div>
              )}
            </div>
          )}
          <p className="text-sm text-gray-400 mb-4">Select a ritual to begin:</p>
          {RITUAL_TEMPLATES.map((template, index) => (
            <motion.button
              key={index}
              onClick={() => handleStartRitual(template)}
              disabled={!canStartRitual}
              className={`w-full text-left p-3 rounded glass-dark border transition-colors ${
                canStartRitual
                  ? "border-white/10 hover:border-white/20"
                  : "border-white/5 opacity-50 cursor-not-allowed"
              }`}
              whileHover={canStartRitual ? { scale: 1.02 } : {}}
              whileTap={canStartRitual ? { scale: 0.98 } : {}}
              title={!canStartRitual ? "Requires OPERATOR role" : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h4 className="font-oswald text-white">{template.name}</h4>
                  </div>
                  <p className="text-xs text-gray-400">{template.description}</p>
                </div>
                <Play className="w-4 h-4 text-green-400 ml-2 flex-shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

