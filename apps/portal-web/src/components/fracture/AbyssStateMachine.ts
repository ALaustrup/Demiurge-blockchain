/**
 * AbyssStateMachine
 * 
 * State machine for the AbyssID ritual sequence.
 * Controls the flow: idle → checking → reject|accept → binding → confirm
 */

export type AbyssState =
  | "idle"
  | "checking"
  | "reject"
  | "accept"
  | "binding"
  | "confirm";

export interface AbyssStateContext {
  state: AbyssState;
  username: string;
  publicKey?: string;
  privateKey?: string;
  seedPhrase?: string;
}

export class AbyssStateMachine {
  private currentState: AbyssState = "idle";
  private context: AbyssStateContext;
  private listeners: Set<(state: AbyssState, context: AbyssStateContext) => void> = new Set();

  constructor() {
    this.context = {
      state: "idle",
      username: "",
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: AbyssState, context: AbyssStateContext) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): AbyssState {
    return this.currentState;
  }

  /**
   * Get context
   */
  getContext(): AbyssStateContext {
    return { ...this.context };
  }

  /**
   * Transition to new state
   */
  private transition(newState: AbyssState, updates?: Partial<AbyssStateContext>): void {
    this.currentState = newState;
    this.context = {
      ...this.context,
      state: newState,
      ...updates,
    };

    // Notify all listeners
    this.listeners.forEach((listener) => {
      listener(newState, this.context);
    });
  }

  /**
   * Set username and start checking
   */
  checkUsername(username: string): void {
    this.context.username = username;
    this.transition("checking");
  }

  /**
   * Username rejected
   */
  rejectUsername(): void {
    this.transition("reject");
  }

  /**
   * Username accepted
   */
  acceptUsername(): void {
    this.transition("accept");
  }

  /**
   * Start binding (key generation)
   */
  startBinding(publicKey: string, privateKey: string, seedPhrase: string): void {
    this.transition("binding", {
      publicKey,
      privateKey,
      seedPhrase,
    });
  }

  /**
   * Confirm and complete ritual
   */
  confirm(): void {
    this.transition("confirm");
  }

  /**
   * Reset to idle
   */
  reset(): void {
    this.transition("idle", {
      username: "",
      publicKey: undefined,
      privateKey: undefined,
      seedPhrase: undefined,
    });
  }
}

