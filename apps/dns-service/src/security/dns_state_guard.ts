/**
 * 💀 DNS State Guard
 * 
 * PHASE OMEGA PART II: Enforces deterministic record updates
 * and validates DNS state integrity
 */

import type { DNSRecord, DNSRecordType, ChainDNSRecord } from '../types';

export interface DNSStateTransition {
  from: DNSRecord | null;
  to: DNSRecord;
  txHash: string;
  blockHeight: number;
}

export class DNSStateGuard {
  /**
   * Validate DNS state transition
   */
  static validateTransition(transition: DNSStateTransition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Verify domain consistency
    if (transition.from && transition.from.domain !== transition.to.domain) {
      errors.push('Domain mismatch in state transition');
    }
    
    // Verify type consistency
    if (transition.from && transition.from.type !== transition.to.type) {
      errors.push('Record type mismatch in state transition');
    }
    
    // Verify TTL constraints
    if (transition.to.ttl < 0 || transition.to.ttl > 2147483647) {
      errors.push(`TTL out of valid range: ${transition.to.ttl}`);
    }
    
    // Verify timestamp progression
    if (transition.from && transition.to.timestamp < transition.from.timestamp) {
      errors.push('Timestamp regression in DNS state');
    }
    
    // Verify block height progression
    if (transition.from && transition.to.timestamp < transition.from.timestamp) {
      errors.push('Block height regression in DNS state');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify no forbidden record types
   */
  static verifyRecordType(type: DNSRecordType): boolean {
    // PHASE OMEGA PART II: Only allow specific record types
    const allowedTypes: DNSRecordType[] = ['A', 'AAAA', 'CNAME', 'TXT', 'NS', 'MX', 'SOA'];
    return allowedTypes.includes(type);
  }

  /**
   * Validate DNS record structure
   */
  static validateRecord(record: DNSRecord): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate domain
    if (!record.domain || record.domain.length === 0) {
      errors.push('Domain is required');
    }
    
    if (!/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/i.test(record.domain)) {
      errors.push('Invalid domain format');
    }
    
    // Validate type
    if (!this.verifyRecordType(record.type)) {
      errors.push(`Forbidden record type: ${record.type}`);
    }
    
    // Validate value
    if (!record.value || (typeof record.value !== 'string' && !Array.isArray(record.value))) {
      errors.push('Value is required and must be string or array');
    }
    
    // Validate TTL
    if (record.ttl < 0 || record.ttl > 2147483647) {
      errors.push(`TTL out of range: ${record.ttl}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify chain DNS record integrity
   */
  static verifyChainRecord(record: ChainDNSRecord): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate asset ID
    if (!record.assetId || record.assetId.length === 0) {
      errors.push('Asset ID is required');
    }
    
    // Validate domain
    const domainCheck = this.validateRecord({
      domain: record.domain,
      type: 'A', // Dummy type for validation
      value: '',
      ttl: 0,
      source: 'chain',
      timestamp: 0,
    });
    
    if (!domainCheck.valid) {
      errors.push(...domainCheck.errors);
    }
    
    // Validate transaction hash
    if (!record.txHash || record.txHash.length !== 64) {
      errors.push('Invalid transaction hash format');
    }
    
    // Validate block height
    if (record.blockHeight < 0) {
      errors.push('Block height cannot be negative');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
