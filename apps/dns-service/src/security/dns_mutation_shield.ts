/**
 * 💀 DNS Mutation Shield
 * 
 * PHASE OMEGA PART II: Rejects malformed state diffs
 * and enforces DNS state integrity
 */

import type { DNSRecord, ChainDNSRecord } from '../types';
import { DNSStateGuard } from './dns_state_guard';
import { DNSUPDATEVerifier } from './dns_update_verifier';

export interface StateDiff {
  added: DNSRecord[];
  modified: Array<{ from: DNSRecord; to: DNSRecord }>;
  removed: DNSRecord[];
  txHash: string;
  blockHeight: number;
}

export class DNSMutationShield {
  /**
   * Validate state diff
   */
  static validateStateDiff(diff: StateDiff): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate all added records
    for (const record of diff.added) {
      const validation = DNSStateGuard.validateRecord(record);
      if (!validation.valid) {
        errors.push(`Invalid added record for ${record.domain}: ${validation.errors.join(', ')}`);
      }
    }
    
    // Validate all modified records
    for (const { from, to } of diff.modified) {
      const transition = DNSStateGuard.validateTransition({
        from,
        to,
        txHash: diff.txHash,
        blockHeight: diff.blockHeight,
      });
      
      if (!transition.valid) {
        errors.push(`Invalid modification for ${to.domain}: ${transition.errors.join(', ')}`);
      }
    }
    
    // Validate transaction hash
    if (!diff.txHash || diff.txHash.length !== 64) {
      errors.push('Invalid transaction hash in state diff');
    }
    
    // Validate block height
    if (diff.blockHeight < 0) {
      errors.push('Block height cannot be negative');
    }
    
    // Verify no conflicting changes
    const allDomains = new Set<string>();
    for (const record of diff.added) {
      const key = `${record.domain}:${record.type}`;
      if (allDomains.has(key)) {
        errors.push(`Conflicting addition for ${record.domain}:${record.type}`);
      }
      allDomains.add(key);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reject malformed state diffs
   */
  static rejectMalformedDiff(diff: StateDiff): { rejected: boolean; reason?: string } {
    // Check for empty diff
    if (diff.added.length === 0 && diff.modified.length === 0 && diff.removed.length === 0) {
      return {
        rejected: true,
        reason: 'Empty state diff',
      };
    }
    
    // Validate structure
    const validation = this.validateStateDiff(diff);
    if (!validation.valid) {
      return {
        rejected: true,
        reason: validation.errors.join('; '),
      };
    }
    
    // Check for suspicious patterns
    if (diff.added.length > 1000) {
      return {
        rejected: true,
        reason: 'Too many additions in single diff (>1000)',
      };
    }
    
    if (diff.modified.length > 1000) {
      return {
        rejected: true,
        reason: 'Too many modifications in single diff (>1000)',
      };
    }
    
    return {
      rejected: false,
    };
  }

  /**
   * Verify chain DNS record mutation
   */
  static verifyChainMutation(
    oldRecord: ChainDNSRecord | null,
    newRecord: ChainDNSRecord
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Verify domain consistency
    if (oldRecord && oldRecord.domain !== newRecord.domain) {
      errors.push('Domain mismatch in chain mutation');
    }
    
    // Verify asset ID consistency
    if (oldRecord && oldRecord.assetId !== newRecord.assetId) {
      errors.push('Asset ID mismatch in chain mutation');
    }
    
    // Verify block height progression
    if (oldRecord && newRecord.blockHeight <= oldRecord.blockHeight) {
      errors.push('Block height regression in chain mutation');
    }
    
    // Validate new record
    const recordValidation = DNSStateGuard.verifyChainRecord(newRecord);
    if (!recordValidation.valid) {
      errors.push(...recordValidation.errors);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
