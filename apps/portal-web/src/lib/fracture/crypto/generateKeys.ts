/**
 * generateKeys
 * 
 * Generates Ed25519 keypair using WebCrypto API.
 * Falls back to RSA if Ed25519 is not supported.
 */

export interface GeneratedKeys {
  publicKey: string;
  privateKey: string;
  seedPhrase: string;
  keyPair: CryptoKeyPair;
}

/**
 * Generate Ed25519 keypair
 */
export async function generateAbyssKeys(): Promise<GeneratedKeys> {
  try {
    // Try Ed25519 first (modern browsers)
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      },
      true, // extractable
      ["sign", "verify"]
    );

    // Export keys
    const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey!);

    // Convert to base58 (simplified - in production use proper base58 library)
    const publicKey = arrayBufferToBase58(new Uint8Array(publicKeyRaw));
    const privateKey = arrayBufferToBase58(new Uint8Array(privateKeyRaw));

    // Generate seed phrase (12 words - simplified, use BIP39 in production)
    const seedPhrase = generateSeedPhrase();

    return {
      publicKey,
      privateKey,
      seedPhrase,
      keyPair,
    };
  } catch (error) {
    // Fallback to RSA if Ed25519 not supported
    console.warn("Ed25519 not supported, falling back to RSA:", error);
    return generateRSAKeys();
  }
}

/**
 * Generate RSA keypair (fallback)
 */
async function generateRSAKeys(): Promise<GeneratedKeys> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyRaw = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey!);

  const publicKey = arrayBufferToBase58(new Uint8Array(publicKeyRaw));
  const privateKey = arrayBufferToBase58(new Uint8Array(privateKeyRaw));
  const seedPhrase = generateSeedPhrase();

  return {
    publicKey,
    privateKey,
    seedPhrase,
    keyPair,
  };
}

/**
 * Convert ArrayBuffer to base58 string (simplified)
 * TODO: Use proper base58 library (bs58) in production
 */
function arrayBufferToBase58(buffer: Uint8Array): string {
  // Simplified base58 encoding (use bs58 library in production)
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt(0);
  for (let i = 0; i < buffer.length; i++) {
    num = num * BigInt(256) + BigInt(buffer[i]);
  }
  let result = "";
  while (num > 0) {
    result = alphabet[Number(num % BigInt(58))] + result;
    num = num / BigInt(58);
  }
  return result || "1";
}

/**
 * Generate seed phrase (simplified - use BIP39 in production)
 */
function generateSeedPhrase(): string {
  // Simplified word list (use full BIP39 word list in production)
  const words = [
    "abyss", "void", "dark", "shadow", "fracture", "nexus", "haven", "scroll",
    "conspire", "archon", "nomad", "demiurge", "sovereign", "chain", "crypto", "key",
    "ritual", "binding", "memory", "threshold", "light", "consume", "forged", "guard",
  ];

  const phrase: string[] = [];
  for (let i = 0; i < 12; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }
  return phrase.join(" ");
}

