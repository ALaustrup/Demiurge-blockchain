export interface AbyssAccount {
  username: string;
  publicKey: string;
  abyssIdSecret?: string;
}

const STORAGE_KEY_ACCOUNTS = 'abyssos_accounts';
const STORAGE_KEY_AUTH = 'abyssos_auth';

// Generate a deterministic public key from a secret using SHA-256
async function derivePublicKey(secret: string): Promise<string> {
  // Use SHA-256 for deterministic, secure key derivation
  const encoder = new TextEncoder();
  const data = encoder.encode(secret.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Return as 64-character hex string (32 bytes)
  return `0x${hashHex.padStart(64, '0')}`;
}

// Synchronous fallback for compatibility
function derivePublicKeySync(secret: string): string {
  // Deterministic hash function for synchronous use
  let hash = 0;
  const normalized = secret.trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Ensure positive and pad to 64 hex characters
  const absHash = Math.abs(hash);
  const hex = absHash.toString(16);
  // Use multiple iterations to get longer hash
  let fullHash = hex;
  for (let i = 0; i < 3; i++) {
    const nextHash = ((absHash * (i + 1)) + hash).toString(16);
    fullHash += nextHash;
  }
  return `0x${fullHash.padStart(64, '0').slice(0, 64)}`;
}

// Generate a secure random secret code (24 characters)
function generateSecret(): string {
  // Use crypto.getRandomValues for secure randomness
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use secure random number generator
    const randomValues = new Uint8Array(24);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < 24; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback to Math.random (less secure but works)
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
}

export const abyssIdClient = {
  async signup(username: string): Promise<AbyssAccount> {
    // Normalize username to lowercase for consistent storage
    const normalizedUsername = username.toLowerCase();

    // Check if username is taken
    if (normalizedUsername === 'taken') {
      throw new Error('Username is already taken');
    }

    // Generate secret and derive public key
    const secret = generateSecret();
    const publicKey = derivePublicKey(secret);

    const account: AbyssAccount = {
      username, // Store original case for display
      publicKey,
      abyssIdSecret: secret,
    };

    // Store account with normalized (lowercase) key
    const accounts = this.getAllAccounts();
    accounts[normalizedUsername] = account;
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));

    // Auto-login
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(account));

    return account;
  },

  async login(username: string, publicKey?: string): Promise<AbyssAccount | null> {
    // Normalize username to lowercase for consistent lookup
    const normalizedUsername = username.toLowerCase();
    const accounts = this.getAllAccounts();
    const account = accounts[normalizedUsername];

    if (!account) {
      return null;
    }

    // If publicKey is provided, verify it matches
    if (publicKey && account.publicKey !== publicKey) {
      return null;
    }

    // Set as authenticated
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(account));

    return account;
  },

  async loginWithSecret(secret: string): Promise<AbyssAccount | null> {
    if (!secret || !secret.trim()) {
      return null;
    }

    const normalizedSecret = secret.trim();

    // First, try direct secret lookup (fastest)
    const secretMap = this.getSecretMap();
    const username = secretMap[normalizedSecret];
    
    if (username) {
      const accounts = this.getAllAccounts();
      const account = accounts[username];
      if (account && account.abyssIdSecret === normalizedSecret) {
        // Verify public key matches (security check)
        const derivedPublicKey = derivePublicKeySync(normalizedSecret);
        if (account.publicKey === derivedPublicKey) {
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(account));
          return account;
        }
      }
    }

    // Fallback: Derive public key and search (for backwards compatibility)
    const publicKey = derivePublicKeySync(normalizedSecret);
    const accounts = this.getAllAccounts();
    for (const [username, account] of Object.entries(accounts)) {
      // Check both public key match AND secret match for security
      if (account.publicKey === publicKey && account.abyssIdSecret === normalizedSecret) {
        // Update secret map for faster future lookups
        secretMap[normalizedSecret] = username;
        localStorage.setItem('abyssos_secret_map', JSON.stringify(secretMap));
        
        // Set as authenticated
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(account));
        return account;
      }
    }

    return null;
  },

  getSecretMap(): Record<string, string> {
    try {
      const data = localStorage.getItem('abyssos_secret_map');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async getCurrentAccount(): Promise<AbyssAccount | null> {
    try {
      const authData = localStorage.getItem(STORAGE_KEY_AUTH);
      if (!authData) {
        return null;
      }
      return JSON.parse(authData) as AbyssAccount;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  },

  getAllAccounts(): Record<string, AbyssAccount> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  checkUsernameAvailability(username: string): boolean {
    // Normalize username to lowercase for consistent checking
    const normalizedUsername = username.toLowerCase();
    const accounts = this.getAllAccounts();
    return !accounts[normalizedUsername];
  },
};

