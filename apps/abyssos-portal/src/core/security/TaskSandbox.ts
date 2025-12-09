/**
 * 💀 Task Sandbox
 * 
 * PHASE OMEGA PART II: Enforces all AbyssOS apps pass through secure sandbox
 * Blocks unverified script execution and provides secure compartments
 */

import { HypervisorGuard, hypervisorGuard } from './HypervisorGuard';
import { MemoryCage, MemoryCageConfig } from './MemoryCage';

export interface SandboxConfig {
  appId: string;
  memoryCage?: Partial<MemoryCageConfig>;
  allowNetwork?: boolean;
  allowStorage?: boolean;
  allowWebGL?: boolean;
}

export interface SandboxResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  violations: number;
  executionTime: number;
}

export class TaskSandbox {
  private guard: HypervisorGuard;
  private memoryCage: MemoryCage;
  private config: SandboxConfig;

  constructor(config: SandboxConfig) {
    this.config = config;
    this.guard = hypervisorGuard;
    this.memoryCage = new MemoryCage(config.appId, config.memoryCage);
  }

  /**
   * Execute function in sandbox
   * PHASE OMEGA PART II: All AbyssOS apps MUST pass through this
   */
  async execute<T>(fn: () => T | Promise<T>): Promise<SandboxResult<T>> {
    const startTime = Date.now();
    const initialViolations = this.guard.getViolations().length;
    
    // Start memory monitoring
    this.memoryCage.start();
    
    try {
      // Check limits before execution
      const limitsCheck = this.memoryCage.checkLimits();
      if (!limitsCheck.allowed) {
        return {
          success: false,
          error: limitsCheck.reason,
          violations: this.guard.getViolations().length - initialViolations,
          executionTime: Date.now() - startTime,
        };
      }

      // Execute function
      const result = await Promise.resolve(fn());
      
      // Check limits after execution
      const postCheck = this.memoryCage.checkLimits();
      if (!postCheck.allowed) {
        return {
          success: false,
          error: `Post-execution limit violation: ${postCheck.reason}`,
          violations: this.guard.getViolations().length - initialViolations,
          executionTime: Date.now() - startTime,
        };
      }

      const violations = this.guard.getViolations().length - initialViolations;
      
      return {
        success: true,
        result,
        violations,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        violations: this.guard.getViolations().length - initialViolations,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Verify network request is allowed
   */
  verifyNetworkRequest(url: string): boolean {
    if (!this.config.allowNetwork) {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      return this.memoryCage.isDomainAllowed(urlObj.hostname);
    } catch {
      return false;
    }
  }

  /**
   * Verify storage access is allowed
   */
  verifyStorageAccess(): boolean {
    return this.config.allowStorage === true;
  }

  /**
   * Verify WebGL access is allowed
   */
  verifyWebGLAccess(): boolean {
    return this.config.allowWebGL === true;
  }

  /**
   * Get sandbox stats
   */
  getStats() {
    return {
      ...this.memoryCage.getStats(),
      violations: this.guard.getViolations().length,
      config: this.config,
    };
  }
}

/**
 * Create sandbox for AbyssOS app
 * PHASE OMEGA PART II: All apps must use this
 */
export function createAppSandbox(appId: string, config?: Partial<SandboxConfig>): TaskSandbox {
  return new TaskSandbox({
    appId,
    memoryCage: {
      maxMemoryMB: 100,
      maxExecutionTime: 5000,
      sandboxed: true,
    },
    allowNetwork: false,
    allowStorage: false,
    allowWebGL: false,
    ...config,
  });
}
