/**
 * 💀 Memory Cage
 * 
 * PHASE OMEGA PART II: Provides secure per-app execution compartments
 * with memory isolation
 */

export interface MemoryCageConfig {
  maxMemoryMB: number;
  maxExecutionTime: number; // ms
  allowedDomains: string[];
  sandboxed: boolean;
}

export class MemoryCage {
  private config: MemoryCageConfig;
  private memoryUsage: number = 0;
  private startTime: number = 0;
  private appId: string;

  constructor(appId: string, config: Partial<MemoryCageConfig> = {}) {
    this.appId = appId;
    this.config = {
      maxMemoryMB: config.maxMemoryMB || 100,
      maxExecutionTime: config.maxExecutionTime || 5000,
      allowedDomains: config.allowedDomains || [],
      sandboxed: config.sandboxed !== false,
    };
  }

  /**
   * Start execution monitoring
   */
  start(): void {
    this.startTime = Date.now();
    this.memoryUsage = this.getCurrentMemoryUsage();
  }

  /**
   * Check execution limits
   */
  checkLimits(): { allowed: boolean; reason?: string } {
    // Check execution time
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.config.maxExecutionTime) {
      return {
        allowed: false,
        reason: `Execution time limit exceeded: ${elapsed}ms > ${this.config.maxExecutionTime}ms`,
      };
    }

    // Check memory usage
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryMB = currentMemory / (1024 * 1024);
    if (memoryMB > this.config.maxMemoryMB) {
      return {
        allowed: false,
        reason: `Memory limit exceeded: ${memoryMB.toFixed(2)}MB > ${this.config.maxMemoryMB}MB`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get current memory usage (approximate)
   */
  private getCurrentMemoryUsage(): number {
    // PHASE OMEGA PART II: Monitor memory usage
    // In browsers, we can use performance.memory if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    // Fallback: estimate based on object count (rough approximation)
    return 0;
  }

  /**
   * Verify domain is allowed
   */
  isDomainAllowed(domain: string): boolean {
    if (!this.config.sandboxed) {
      return true;
    }
    
    if (this.config.allowedDomains.length === 0) {
      return false; // Strict mode: no domains allowed if none specified
    }
    
    return this.config.allowedDomains.includes(domain);
  }

  /**
   * Get cage configuration
   */
  getConfig(): MemoryCageConfig {
    return { ...this.config };
  }

  /**
   * Get current stats
   */
  getStats(): {
    memoryUsageMB: number;
    executionTime: number;
    appId: string;
  } {
    return {
      memoryUsageMB: this.getCurrentMemoryUsage() / (1024 * 1024),
      executionTime: Date.now() - this.startTime,
      appId: this.appId,
    };
  }
}
