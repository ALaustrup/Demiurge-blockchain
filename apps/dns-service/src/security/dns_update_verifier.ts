/**
 * 💀 DNS Update Verifier
 * 
 * PHASE OMEGA PART II: Verifies DNS record updates are valid
 * and rejects malformed state diffs
 */

import type { DNSRecord, DNSRecordType } from '../types';
import { DNSStateGuard } from './dns_state_guard';

export interface DNSUpdate {
  domain: string;
  type: DNSRecordType;
  oldValue?: string | string[];
  newValue: string | string[];
  ttl?: number;
  txHash: string;
  blockHeight: number;
}

export class DNSUPDATEVerifier {
  /**
   * Verify DNS update is valid
   */
  static verifyUpdate(update: DNSUpdate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Verify domain format
    if (!update.domain || update.domain.length === 0) {
      errors.push('Domain is required');
    }
    
    // Verify record type is allowed
    if (!DNSStateGuard.verifyRecordType(update.type)) {
      errors.push(`Forbidden record type: ${update.type}`);
    }
    
    // Verify value format based on type
    const valueCheck = this.verifyValueFormat(update.type, update.newValue);
    if (!valueCheck.valid) {
      errors.push(...valueCheck.errors);
    }
    
    // Verify TTL if provided
    if (update.ttl !== undefined) {
      if (update.ttl < 0 || update.ttl > 2147483647) {
        errors.push(`TTL out of range: ${update.ttl}`);
      }
    }
    
    // Verify transaction hash
    if (!update.txHash || update.txHash.length !== 64) {
      errors.push('Invalid transaction hash format');
    }
    
    // Verify block height
    if (update.blockHeight < 0) {
      errors.push('Block height cannot be negative');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify value format based on record type
   */
  private static verifyValueFormat(
    type: DNSRecordType,
    value: string | string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const values = Array.isArray(value) ? value : [value];
    
    for (const val of values) {
      if (typeof val !== 'string' || val.length === 0) {
        errors.push('Value must be non-empty string');
        continue;
      }
      
      switch (type) {
        case 'A':
          if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(val)) {
            errors.push(`Invalid IPv4 address: ${val}`);
          }
          break;
          
        case 'AAAA':
          if (!/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(val)) {
            errors.push(`Invalid IPv6 address: ${val}`);
          }
          break;
          
        case 'CNAME':
        case 'NS':
          if (!/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/i.test(val)) {
            errors.push(`Invalid domain format: ${val}`);
          }
          break;
          
        case 'TXT':
          // TXT records can contain any text
          if (val.length > 255) {
            errors.push(`TXT record too long: ${val.length} > 255`);
          }
          break;
          
        case 'MX':
          // MX format: priority domain
          if (!/^\d+\s+[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/i.test(val)) {
            errors.push(`Invalid MX record format: ${val}`);
          }
          break;
          
        case 'SOA':
          // SOA format is complex, basic validation
          if (val.split(' ').length < 7) {
            errors.push(`Invalid SOA record format: ${val}`);
          }
          break;
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify update doesn't violate constraints
   */
  static verifyConstraints(update: DNSUpdate, existingRecords: DNSRecord[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check for duplicate records
    const duplicates = existingRecords.filter(
      r => r.domain === update.domain && r.type === update.type
    );
    
    if (duplicates.length > 0 && update.oldValue === undefined) {
      errors.push('Cannot create duplicate record without specifying old value');
    }
    
    // Check domain ownership (if applicable)
    // In a real implementation, we'd verify the transaction sender owns the domain
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
