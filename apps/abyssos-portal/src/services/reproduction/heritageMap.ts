/**
 * Heritage Map
 * 
 * Tracks ancestry and lineage branches
 */

import type { HeritageRecord } from './reproductionTypes';
import { getLocalPeerId } from '../grid/peer';

class HeritageMap {
  private records: Map<string, HeritageRecord> = new Map();
  private lineages: Map<string, string[]> = new Map(); // lineage -> instanceIds[]
  
  /**
   * Record new instance
   */
  recordInstance(record: HeritageRecord): void {
    this.records.set(record.instanceId, record);
    
    // Add to lineage
    if (!this.lineages.has(record.lineage)) {
      this.lineages.set(record.lineage, []);
    }
    this.lineages.get(record.lineage)!.push(record.instanceId);
  }
  
  /**
   * Get instance record
   */
  getInstance(instanceId: string): HeritageRecord | undefined {
    return this.records.get(instanceId);
  }
  
  /**
   * Get ancestry chain
   */
  getAncestry(instanceId: string): HeritageRecord[] {
    const chain: HeritageRecord[] = [];
    let current: HeritageRecord | undefined = this.records.get(instanceId);
    
    while (current) {
      chain.push(current);
      if (current.parentId) {
        current = this.records.get(current.parentId);
      } else {
        break;
      }
    }
    
    return chain.reverse(); // Oldest first
  }
  
  /**
   * Get descendants
   */
  getDescendants(instanceId: string): HeritageRecord[] {
    return Array.from(this.records.values())
      .filter(r => {
        let current: HeritageRecord | undefined = r;
        while (current && current.parentId) {
          if (current.parentId === instanceId) {
            return true;
          }
          current = this.records.get(current.parentId);
        }
        return false;
      });
  }
  
  /**
   * Get lineage members
   */
  getLineageMembers(lineage: string): HeritageRecord[] {
    const instanceIds = this.lineages.get(lineage) || [];
    return instanceIds
      .map(id => this.records.get(id))
      .filter((r): r is HeritageRecord => r !== undefined);
  }
  
  /**
   * Get all lineages
   */
  getAllLineages(): string[] {
    return Array.from(this.lineages.keys());
  }
  
  /**
   * Mark instance as extinct
   */
  markExtinct(instanceId: string): void {
    const record = this.records.get(instanceId);
    if (record) {
      record.status = 'extinct';
    }
  }
  
  /**
   * Mark instance as merged
   */
  markMerged(instanceId: string, mergedInto: string): void {
    const record = this.records.get(instanceId);
    if (record) {
      record.status = 'merged';
    }
  }
}

// Singleton instance
export const heritageMap = new HeritageMap();

// Initialize with root instance (lazy initialization to avoid circular dependency)
if (typeof window !== 'undefined') {
  // Defer initialization to avoid module load order issues
  setTimeout(() => {
    try {
      const rootId = getLocalPeerId();
      heritageMap.recordInstance({
        instanceId: rootId,
        parentId: null,
        generation: 0,
        lineage: 'root',
        divergence: 0,
        traits: {
          kernelHeuristics: [],
          spiritBehaviors: [],
          computeFocus: 'general',
          mutationRate: 0.1,
          stabilityThreshold: 0.7,
          growthAggressiveness: 0.5,
        },
        createdAt: Date.now(),
        status: 'active',
      });
    } catch (error) {
      console.error('Failed to initialize heritage map:', error);
    }
  }, 0);
}

