/**
 * Ritual Engine Types
 * 
 * Defines the structure for AbyssID rituals, phases, events, and effects.
 */

export type RitualPhase = 
  | "idle"
  | "initiating"
  | "active"
  | "peaking"
  | "dissolving"
  | "completed"
  | "aborted";

export interface RitualParameters {
  intensity?: number; // 0.0 - 1.0
  duration?: number; // milliseconds
  frequency?: number; // Hz
  colorShift?: number; // 0.0 - 1.0
  turbulence?: number; // 0.0 - 1.0
  [key: string]: any; // Allow custom parameters
}

export interface RitualEffects {
  shaderUniforms?: {
    turbulence?: number;
    chromaShift?: number;
    glitchAmount?: number;
    bloomIntensity?: number;
    vignetteIntensity?: number;
    [key: string]: number | undefined;
  };
  fabricVisuals?: {
    nodeGlow?: boolean;
    edgePulse?: boolean;
    highlightNodes?: string[]; // node IDs
    [key: string]: any;
  };
  audioReactive?: {
    sensitivity?: number;
    frequencyRange?: [number, number];
    [key: string]: any;
  };
}

export interface Ritual {
  id: string;
  name: string;
  description: string;
  parameters: RitualParameters;
  phase: RitualPhase;
  effects: RitualEffects;
  startedAt?: number;
  completedAt?: number;
  abortedAt?: number;
  createdBy?: string; // user address
}

export type RitualEventType = 
  | "RitualStarted"
  | "RitualPhaseChanged"
  | "RitualCompleted"
  | "RitualAborted"
  | "RitualParameterChanged";

export interface RitualEvent {
  id: string;
  ritualId: string;
  type: RitualEventType;
  phase: RitualPhase;
  timestamp: number;
  parameters?: RitualParameters;
  effects?: RitualEffects;
  metadata?: Record<string, any>;
}

