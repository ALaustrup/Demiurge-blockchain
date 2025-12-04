/**
 * AbyssID SDK
 * 
 * High-level API for AbyssID identity management.
 * Provides a clean interface for creating, loading, and managing AbyssID sessions.
 */

export interface AbyssSession {
  username: string;
  publicKey: string;
  sessionId: string;
  createdAt: number;
}

const STORAGE_KEY = 'abyssos.session.v1';

/**
 * Create a new AbyssID session
 */
export async function createAbyssId(username: string): Promise<AbyssSession> {
  if (!username || username.trim().length === 0) {
    throw new Error('Username is required');
  }

  // Generate a deterministic public key from username (placeholder)
  // In production, this would use proper cryptographic keypair generation
  const sessionId = `abyss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const publicKey = derivePublicKeyFromUsername(username, sessionId);

  const session: AbyssSession = {
    username: username.trim(),
    publicKey,
    sessionId,
    createdAt: Date.now(),
  };

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Load existing AbyssID session from storage
 */
export function loadSession(): AbyssSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const session = JSON.parse(stored) as AbyssSession;
    
    // Validate session structure
    if (session.username && session.publicKey && session.sessionId) {
      return session;
    }
  } catch (error) {
    console.warn('Failed to load AbyssID session:', error);
  }

  return null;
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Sign a message with the current session
 * 
 * @param message - Message to sign (string or Uint8Array)
 * @returns Promise resolving to signature object
 */
export async function signMessage(
  message: string | Uint8Array
): Promise<{ signature: string; algo: string; devMode: boolean }> {
  const session = loadSession();
  if (!session) {
    throw new Error('No active AbyssID session');
  }

  // Convert message to string if needed
  const messageStr = typeof message === 'string' 
    ? message 
    : new TextDecoder().decode(message);

  // Generate mock signature (placeholder for real crypto)
  const signature = await generateMockSignature(session.username, messageStr);

  return {
    signature,
    algo: 'mock-sha256',
    devMode: true,
  };
}

// Helper functions

function derivePublicKeyFromUsername(username: string, sessionId: string): string {
  // Simple deterministic derivation (placeholder)
  // In production, use proper cryptographic keypair generation
  const combined = `${username}:${sessionId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

async function generateMockSignature(username: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${username}:${message}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `mock_sig_${hashHex.substring(0, 32)}`;
}

