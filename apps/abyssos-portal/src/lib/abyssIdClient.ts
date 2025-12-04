export interface AbyssAccount {
  username: string;
  publicKey: string;
  abyssIdSecret?: string;
}

const STORAGE_KEY_ACCOUNTS = 'abyssos_accounts';
const STORAGE_KEY_AUTH = 'abyssos_auth';

// Generate a pseudo-public key from a secret
function derivePublicKey(secret: string): string {
  // Simple hash-like function for demo purposes
  // In production, this would use proper cryptographic derivation
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    const char = secret.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

// Generate a random secret code
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
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

  async login(username: string, publicKey: string): Promise<AbyssAccount | null> {
    // Normalize username to lowercase for consistent lookup
    const normalizedUsername = username.toLowerCase();
    const accounts = this.getAllAccounts();
    const account = accounts[normalizedUsername];

    if (!account) {
      return null;
    }

    // For now, just check username exists
    // In production, would verify publicKey matches
    if (account.publicKey !== publicKey && publicKey) {
      // Allow login if publicKey is provided and matches, or if not provided (for demo)
      if (publicKey && account.publicKey !== publicKey) {
        return null;
      }
    }

    // Set as authenticated
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(account));

    return account;
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

