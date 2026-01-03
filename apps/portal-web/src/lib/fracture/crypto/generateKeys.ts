/**
 * generateKeys
 * 
 * Generates AbyssID identity keys and seed phrase.
 * 
 * TODO: Replace this stub with proper Ed25519 keypair generation and secure seed handling.
 */

export interface GeneratedAbyssIdentity {
  publicKey: string;
  privateKey: string;
  seedPhrase: string;
}

const WORD_LIST = [
  "abyss", "void", "dark", "shadow", "fracture", "nexus", "haven", "scroll",
  "conspire", "archon", "nomad", "demiurge", "sovereign", "chain", "crypto", "key",
  "ritual", "binding", "memory", "threshold", "light", "consume", "forged", "guard",
  "eternal", "flame", "will", "serve", "ancient", "majestic", "terrifying", "inevitable",
];

/**
 * Derive keys from a seed phrase (deterministic)
 */
export async function deriveKeysFromSeed(seedPhrase: string): Promise<{ publicKey: string; privateKey: string }> {
  // Normalize seed phrase
  const normalized = seedPhrase.toLowerCase().trim();
  
  // Create a deterministic hash from the seed phrase
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  
  let hashBytes: Uint8Array;
  try {
    // Use WebCrypto to create a deterministic hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    hashBytes = new Uint8Array(hashBuffer);
  } catch (error) {
    // Fallback: simple hash
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    hashBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hashBytes[i] = (hash + i * 7) & 0xFF;
    }
  }

  // Generate keys from hash (deterministic)
  const hexString = Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const publicKey = `ABYSS-PUB-${hexString.substring(0, 32)}`;
  const privateKey = `ABYSS-PRIV-${hexString.substring(32, 64)}`;

  return { publicKey, privateKey };
}

/**
 * Generate AbyssID identity (creates new seed phrase and derives keys from it)
 * This ensures the seed phrase can be used to recover the keys later.
 */
export async function generateKeys(username: string): Promise<GeneratedAbyssIdentity> {
  // Generate seed phrase first (8 words)
  const seedWords: string[] = [];
  const wordCount = 8;

  try {
    // Use crypto.getRandomValues for secure random selection
    const randomBytes = new Uint8Array(wordCount);
    crypto.getRandomValues(randomBytes);
    
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = randomBytes[i] % WORD_LIST.length;
      seedWords.push(WORD_LIST[randomIndex]);
    }
  } catch (error) {
    // Fallback: use Math.random
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
      seedWords.push(WORD_LIST[randomIndex]);
    }
  }

  const seedPhrase = seedWords.join(" ");

  // Derive keys from seed phrase (deterministic)
  const { publicKey, privateKey } = await deriveKeysFromSeed(seedPhrase);

  return {
    publicKey,
    privateKey,
    seedPhrase,
  };
}
