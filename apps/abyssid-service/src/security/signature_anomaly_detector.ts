/**
 * 💀 Signature Anomaly Detector
 * 
 * PHASE OMEGA PART II: Detects signature pattern anomalies
 * and rejects suspicious or malformed signatures
 */

export interface SignaturePattern {
  signature: string;
  timestamp: number;
  source: string;
  pattern: 'normal' | 'anomalous' | 'suspicious';
}

export class SignatureAnomalyDetector {
  private signatureHistory: Map<string, SignaturePattern[]> = new Map();
  private readonly MAX_HISTORY = 1000;
  private readonly ANOMALY_THRESHOLD = 0.1; // 10% anomaly rate triggers alert

  /**
   * Detect signature anomalies
   */
  detectAnomalies(
    signature: string,
    source: string,
    context?: Record<string, any>
  ): { isAnomalous: boolean; reason?: string; confidence: number } {
    // Validate signature format
    if (!this.validateSignatureFormat(signature)) {
      return {
        isAnomalous: true,
        reason: 'Invalid signature format',
        confidence: 1.0,
      };
    }
    
    // Check for replay attacks
    if (this.isReplayAttack(signature, source)) {
      return {
        isAnomalous: true,
        reason: 'Replay attack detected',
        confidence: 0.95,
      };
    }
    
    // Check signature pattern
    const pattern = this.analyzeSignaturePattern(signature, source);
    
    if (pattern === 'anomalous') {
      return {
        isAnomalous: true,
        reason: 'Anomalous signature pattern detected',
        confidence: 0.8,
      };
    }
    
    if (pattern === 'suspicious') {
      return {
        isAnomalous: false,
        reason: 'Suspicious pattern detected (monitoring)',
        confidence: 0.5,
      };
    }
    
    // Record signature
    this.recordSignature(signature, source);
    
    return {
      isAnomalous: false,
      confidence: 1.0,
    };
  }

  /**
   * Validate signature format
   */
  private validateSignatureFormat(signature: string): boolean {
    // Ed25519 signatures are 64 bytes = 128 hex characters
    if (signature.length !== 128) {
      return false;
    }
    
    // Must be valid hex
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check for replay attacks
   */
  private isReplayAttack(signature: string, source: string): boolean {
    const history = this.signatureHistory.get(source) || [];
    
    // Check if this exact signature was seen recently
    const recent = history.filter(
      p => p.signature === signature && Date.now() - p.timestamp < 60000 // 1 minute window
    );
    
    return recent.length > 0;
  }

  /**
   * Analyze signature pattern
   */
  private analyzeSignaturePattern(signature: string, source: string): 'normal' | 'anomalous' | 'suspicious' {
    const history = this.signatureHistory.get(source) || [];
    
    if (history.length < 10) {
      // Not enough history to analyze
      return 'normal';
    }
    
    // Check for unusual patterns
    // - All zeros (invalid)
    if (signature.match(/^0+$/)) {
      return 'anomalous';
    }
    
    // - Repeated patterns (suspicious)
    if (this.hasRepeatedPattern(signature)) {
      return 'suspicious';
    }
    
    // - Entropy check (low entropy = suspicious)
    const entropy = this.calculateEntropy(signature);
    if (entropy < 3.0) {
      return 'suspicious';
    }
    
    return 'normal';
  }

  /**
   * Check for repeated patterns in signature
   */
  private hasRepeatedPattern(signature: string): boolean {
    // Check for 4+ character repetitions
    for (let len = 4; len <= 16; len++) {
      for (let i = 0; i <= signature.length - len * 2; i++) {
        const pattern = signature.substring(i, i + len);
        const next = signature.substring(i + len, i + len * 2);
        if (pattern === next) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Calculate entropy of signature
   */
  private calculateEntropy(signature: string): number {
    const freq: Record<string, number> = {};
    for (const char of signature) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const length = signature.length;
    
    for (const count of Object.values(freq)) {
      const p = count / length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  /**
   * Record signature in history
   */
  private recordSignature(signature: string, source: string): void {
    const history = this.signatureHistory.get(source) || [];
    history.push({
      signature,
      timestamp: Date.now(),
      source,
      pattern: 'normal',
    });
    
    // Keep only recent history
    const recent = history.slice(-this.MAX_HISTORY);
    this.signatureHistory.set(source, recent);
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStats(source?: string): {
    total: number;
    anomalous: number;
    suspicious: number;
    anomalyRate: number;
  } {
    const sources = source ? [source] : Array.from(this.signatureHistory.keys());
    let total = 0;
    let anomalous = 0;
    let suspicious = 0;
    
    for (const src of sources) {
      const history = this.signatureHistory.get(src) || [];
      total += history.length;
      anomalous += history.filter(p => p.pattern === 'anomalous').length;
      suspicious += history.filter(p => p.pattern === 'suspicious').length;
    }
    
    return {
      total,
      anomalous,
      suspicious,
      anomalyRate: total > 0 ? (anomalous + suspicious) / total : 0,
    };
  }
}

// Global instance
export const signatureAnomalyDetector = new SignatureAnomalyDetector();
