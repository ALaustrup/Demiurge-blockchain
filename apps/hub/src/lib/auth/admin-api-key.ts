/**
 * Admin API key verification (server-only).
 *
 * Keys come exclusively from the `NFT_ADMIN_API_KEYS` env var (comma-separated).
 * When the variable is unset or empty, no key is ever accepted (fail closed).
 * Comparison is constant-time via `crypto.timingSafeEqual` on equal-length buffers.
 */

import { timingSafeEqual } from 'crypto';

function configuredKeys(): string[] {
  const raw = process.env.NFT_ADMIN_API_KEYS || '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export function isValidAdminApiKey(candidate: string | null | undefined): boolean {
  if (!candidate) return false;
  const keys = configuredKeys();
  if (keys.length === 0) return false;

  const candidateBuf = Buffer.from(candidate, 'utf8');
  let matched = false;
  for (const key of keys) {
    const keyBuf = Buffer.from(key, 'utf8');
    if (keyBuf.length === candidateBuf.length && timingSafeEqual(keyBuf, candidateBuf)) {
      matched = true; // keep looping: no early exit on match
    }
  }
  return matched;
}
