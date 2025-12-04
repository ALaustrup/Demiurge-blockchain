/**
 * Ritual Engine v1
 * 
 * Client-side state machine for managing AbyssID rituals.
 * Handles ritual lifecycle, phase transitions, and effect propagation.
 */

import { Ritual, RitualPhase, RitualEvent, RitualEventType, RitualParameters, RitualEffects } from "./ritualTypes";

export interface RitualEngineCallbacks {
  onPhaseChange?: (ritual: Ritual, previousPhase: RitualPhase) => void;
  onEvent?: (event: RitualEvent) => void;
  onEffectsUpdate?: (effects: RitualEffects) => void;
}

export class RitualEngine {
  private currentRitual: Ritual | null = null;
  private phaseTimer: NodeJS.Timeout | null = null;
  private callbacks: RitualEngineCallbacks = {};

  constructor(callbacks?: RitualEngineCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  /**
   * Start a ritual.
   */
  async startRitual(ritual: Ritual): Promise<void> {
    if (this.currentRitual && this.currentRitual.phase !== "idle" && this.currentRitual.phase !== "completed" && this.currentRitual.phase !== "aborted") {
      throw new Error("A ritual is already active");
    }

    this.currentRitual = {
      ...ritual,
      phase: "initiating",
      startedAt: Date.now(),
    };

    this.emitEvent({
      id: `ritual_event_${Date.now()}`,
      ritualId: ritual.id,
      type: "RitualStarted",
      phase: "initiating",
      timestamp: Date.now(),
      parameters: ritual.parameters,
      effects: ritual.effects,
    });

    this.callbacks.onPhaseChange?.(this.currentRitual, "idle");

    // Transition to active after a brief delay
    setTimeout(() => {
      this.transitionPhase("active");
    }, 1000);
  }

  /**
   * Transition ritual to a new phase.
   */
  transitionPhase(newPhase: RitualPhase): void {
    if (!this.currentRitual) {
      return;
    }

    const previousPhase = this.currentRitual.phase;
    this.currentRitual.phase = newPhase;

    if (newPhase === "completed") {
      this.currentRitual.completedAt = Date.now();
    } else if (newPhase === "aborted") {
      this.currentRitual.abortedAt = Date.now();
    }

    this.emitEvent({
      id: `ritual_event_${Date.now()}`,
      ritualId: this.currentRitual.id,
      type: "RitualPhaseChanged",
      phase: newPhase,
      timestamp: Date.now(),
      parameters: this.currentRitual.parameters,
      effects: this.currentRitual.effects,
    });

    this.callbacks.onPhaseChange?.(this.currentRitual, previousPhase);
    this.callbacks.onEffectsUpdate?.(this.currentRitual.effects);

    // Auto-transitions
    if (newPhase === "active") {
      // Transition to peaking after duration or based on parameters
      const duration = this.currentRitual.parameters.duration || 10000;
      this.phaseTimer = setTimeout(() => {
        this.transitionPhase("peaking");
      }, duration * 0.6); // Peak at 60% of duration
    } else if (newPhase === "peaking") {
      const duration = this.currentRitual.parameters.duration || 10000;
      this.phaseTimer = setTimeout(() => {
        this.transitionPhase("dissolving");
      }, duration * 0.2); // Dissolve for 20% of duration
    } else if (newPhase === "dissolving") {
      const duration = this.currentRitual.parameters.duration || 10000;
      this.phaseTimer = setTimeout(() => {
        this.transitionPhase("completed");
      }, duration * 0.2); // Complete after 20% of duration
    }
  }

  /**
   * Abort the current ritual.
   */
  abortRitual(): void {
    if (!this.currentRitual) {
      return;
    }

    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    this.transitionPhase("aborted");

    this.emitEvent({
      id: `ritual_event_${Date.now()}`,
      ritualId: this.currentRitual.id,
      type: "RitualAborted",
      phase: "aborted",
      timestamp: Date.now(),
    });
  }

  /**
   * Update ritual parameters.
   */
  updateParameters(parameters: Partial<RitualParameters>): void {
    if (!this.currentRitual) {
      return;
    }

    this.currentRitual.parameters = {
      ...this.currentRitual.parameters,
      ...parameters,
    };

    this.emitEvent({
      id: `ritual_event_${Date.now()}`,
      ritualId: this.currentRitual.id,
      type: "RitualParameterChanged",
      phase: this.currentRitual.phase,
      timestamp: Date.now(),
      parameters: this.currentRitual.parameters,
    });
  }

  /**
   * Update ritual effects.
   */
  updateEffects(effects: Partial<RitualEffects>): void {
    if (!this.currentRitual) {
      return;
    }

    this.currentRitual.effects = {
      ...this.currentRitual.effects,
      ...effects,
    };

    this.callbacks.onEffectsUpdate?.(this.currentRitual.effects);
  }

  /**
   * Get current ritual.
   */
  getCurrentRitual(): Ritual | null {
    return this.currentRitual;
  }

  /**
   * Emit a ritual event.
   */
  private emitEvent(event: RitualEvent): void {
    this.callbacks.onEvent?.(event);
  }

  /**
   * Cleanup.
   */
  destroy(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    this.currentRitual = null;
  }
}

