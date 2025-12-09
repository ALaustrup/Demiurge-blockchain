/**
 * 💀 Wallet State Sentinel
 * 
 * PHASE OMEGA PART II: Validates wallet state transitions
 * and rejects suspicious or malformed states
 */

export interface WalletState {
  address: string;
  balance: number;
  nonce: number;
  lastTransactionHash?: string;
  timestamp: number;
}

export interface WalletStateTransition {
  from: WalletState;
  to: WalletState;
  transactionHash: string;
  amount: number;
  type: 'send' | 'receive' | 'mint' | 'burn';
}

export class WalletStateSentinel {
  /**
   * Validate wallet state transition
   */
  static validateTransition(transition: WalletStateTransition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Verify address consistency
    if (transition.from.address !== transition.to.address) {
      errors.push('Address mismatch in state transition');
    }
    
    // Verify nonce progression
    if (transition.to.nonce <= transition.from.nonce) {
      errors.push(`Nonce regression: ${transition.to.nonce} <= ${transition.from.nonce}`);
    }
    
    // Verify timestamp progression
    if (transition.to.timestamp < transition.from.timestamp) {
      errors.push(`Timestamp regression: ${transition.to.timestamp} < ${transition.from.timestamp}`);
    }
    
    // Verify balance transitions based on type
    switch (transition.type) {
      case 'send':
        if (transition.to.balance > transition.from.balance) {
          errors.push('Balance increased on send transaction');
        }
        if (transition.from.balance - transition.to.balance !== transition.amount) {
          errors.push('Balance change does not match transaction amount');
        }
        break;
        
      case 'receive':
        if (transition.to.balance < transition.from.balance) {
          errors.push('Balance decreased on receive transaction');
        }
        if (transition.to.balance - transition.from.balance !== transition.amount) {
          errors.push('Balance change does not match transaction amount');
        }
        break;
        
      case 'mint':
        if (transition.to.balance < transition.from.balance) {
          errors.push('Balance decreased on mint transaction');
        }
        if (transition.to.balance - transition.from.balance !== transition.amount) {
          errors.push('Balance change does not match mint amount');
        }
        break;
        
      case 'burn':
        if (transition.to.balance > transition.from.balance) {
          errors.push('Balance increased on burn transaction');
        }
        if (transition.from.balance - transition.to.balance !== transition.amount) {
          errors.push('Balance change does not match burn amount');
        }
        break;
    }
    
    // Verify balance is non-negative
    if (transition.to.balance < 0) {
      errors.push('Balance cannot be negative');
    }
    
    // Verify transaction hash is set
    if (!transition.to.lastTransactionHash) {
      errors.push('Last transaction hash is missing');
    }
    
    if (transition.to.lastTransactionHash !== transition.transactionHash) {
      errors.push('Last transaction hash mismatch');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate wallet state structure
   */
  static validateState(state: WalletState): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate address format
    if (!state.address || state.address.length !== 64) {
      errors.push(`Invalid address format: expected 64 hex chars, got ${state.address?.length || 0}`);
    }
    
    if (state.address && !/^[0-9a-fA-F]+$/.test(state.address)) {
      errors.push('Address contains invalid characters');
    }
    
    // Validate balance
    if (state.balance < 0) {
      errors.push('Balance cannot be negative');
    }
    
    if (!Number.isFinite(state.balance)) {
      errors.push('Balance must be a finite number');
    }
    
    // Validate nonce
    if (state.nonce < 0) {
      errors.push('Nonce cannot be negative');
    }
    
    if (!Number.isInteger(state.nonce)) {
      errors.push('Nonce must be an integer');
    }
    
    // Validate timestamp
    if (state.timestamp < 0) {
      errors.push('Timestamp cannot be negative');
    }
    
    if (state.timestamp > Date.now() + 60000) {
      errors.push('Timestamp is in the future (more than 1 minute)');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect suspicious state patterns
   */
  static detectSuspiciousPatterns(
    currentState: WalletState,
    history: WalletState[]
  ): {
    suspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    // Check for rapid balance changes
    if (history.length >= 2) {
      const recent = history.slice(-10);
      const balanceChanges = recent.map(s => Math.abs(s.balance - currentState.balance));
      const avgChange = balanceChanges.reduce((a, b) => a + b, 0) / balanceChanges.length;
      
      if (avgChange > currentState.balance * 0.5) {
        reasons.push('Rapid balance changes detected');
      }
    }
    
    // Check for nonce jumps
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      const nonceJump = currentState.nonce - lastState.nonce;
      
      if (nonceJump > 10) {
        reasons.push(`Large nonce jump detected: ${nonceJump}`);
      }
    }
    
    // Check for timestamp anomalies
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      const timeDiff = currentState.timestamp - lastState.timestamp;
      
      if (timeDiff < 0) {
        reasons.push('Timestamp regression detected');
      }
      
      if (timeDiff > 3600000) {
        reasons.push('Large timestamp gap detected (>1 hour)');
      }
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }
}
