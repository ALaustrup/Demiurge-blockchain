/**
 * Utility functions for Demiurge SDK
 */

const CGT_DECIMALS = 8;
const CGT_DIVISOR = BigInt(10 ** CGT_DECIMALS);

/**
 * Convert CGT from smallest units (string) to human-readable number
 */
export function cgtFromSmallest(smallest: string | number): number {
  let smallestStr: string;
  if (typeof smallest === 'string') {
    smallestStr = smallest.split('.')[0];
  } else {
    smallestStr = Math.floor(smallest).toString();
  }

  if (!/^-?\d+$/.test(smallestStr)) {
    throw new Error(`Invalid CGT smallest units: ${smallest}`);
  }

  const big = BigInt(smallestStr);
  return Number(big) / Number(CGT_DIVISOR);
}

/**
 * Convert CGT from human-readable number to smallest units (string)
 */
export function cgtToSmallest(amount: number): string {
  const big = BigInt(Math.floor(amount * Number(CGT_DIVISOR)));
  return big.toString();
}

/**
 * Format CGT for display
 */
export function formatCgt(amount: string | number): string {
  const num = typeof amount === 'string' ? cgtFromSmallest(amount) : amount;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: CGT_DECIMALS,
  });
}

/**
 * Validate address format (64-char hex)
 */
export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-f]{64}$/i.test(address);
}

/**
 * Validate username format (3-32 chars, lowercase alphanumeric + underscore)
 */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,32}$/.test(username);
}

/**
 * Format address for display (first 8 + last 8 chars)
 */
export function formatAddress(address: string): string {
  if (!isValidAddress(address)) {
    return address;
  }
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

