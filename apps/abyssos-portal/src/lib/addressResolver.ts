/**
 * Address Resolver
 * 
 * Resolves blockchain addresses to AbyssID usernames with caching.
 * This provides a unified way to display human-readable names across the UI.
 */

const RPC_URL = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';

interface AbyssIDProfile {
  address: string;
  username?: string;
  handle?: string;
  level: number;
  xp: number;
  isArchon: boolean;
}

interface ResolvedAddress {
  address: string;
  username: string | null;
  handle: string | null;
  isArchon: boolean;
  resolvedAt: number;
}

// In-memory cache for resolved addresses
const addressCache = new Map<string, ResolvedAddress>();

// Pending requests to avoid duplicate RPC calls
const pendingRequests = new Map<string, Promise<ResolvedAddress>>();

// Cache TTL (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Normalize an address to lowercase hex without 0x prefix
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/^0x/, '');
}

/**
 * Format an address for display (truncated)
 */
export function formatAddress(address: string, length: number = 8): string {
  const normalized = address.startsWith('0x') ? address : `0x${address}`;
  if (normalized.length <= length * 2 + 2) return normalized;
  return `${normalized.slice(0, length + 2)}...${normalized.slice(-length)}`;
}

/**
 * Resolve an address to an AbyssID profile
 */
async function fetchProfile(address: string): Promise<AbyssIDProfile | null> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'abyssid_get',
        params: { address: normalizeAddress(address) },
        id: Date.now(),
      }),
    });

    const json = await response.json();
    if (json.result && json.result.exists !== false) {
      return json.result as AbyssIDProfile;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch AbyssID profile:', error);
    return null;
  }
}

/**
 * Resolve a single address to username
 */
export async function resolveAddress(address: string): Promise<ResolvedAddress> {
  const normalized = normalizeAddress(address);
  
  // Check cache first
  const cached = addressCache.get(normalized);
  if (cached && Date.now() - cached.resolvedAt < CACHE_TTL) {
    return cached;
  }

  // Check if there's already a pending request
  const pending = pendingRequests.get(normalized);
  if (pending) {
    return pending;
  }

  // Create new request
  const request = (async (): Promise<ResolvedAddress> => {
    const profile = await fetchProfile(normalized);
    
    const resolved: ResolvedAddress = {
      address: normalized,
      username: profile?.username || null,
      handle: profile?.handle || null,
      isArchon: profile?.isArchon || false,
      resolvedAt: Date.now(),
    };

    // Update cache
    addressCache.set(normalized, resolved);
    pendingRequests.delete(normalized);

    return resolved;
  })();

  pendingRequests.set(normalized, request);
  return request;
}

/**
 * Resolve multiple addresses in batch
 */
export async function resolveAddresses(addresses: string[]): Promise<Map<string, ResolvedAddress>> {
  const results = new Map<string, ResolvedAddress>();
  const toFetch: string[] = [];

  // Check cache first
  for (const address of addresses) {
    const normalized = normalizeAddress(address);
    const cached = addressCache.get(normalized);
    if (cached && Date.now() - cached.resolvedAt < CACHE_TTL) {
      results.set(normalized, cached);
    } else {
      toFetch.push(normalized);
    }
  }

  // Fetch remaining addresses
  if (toFetch.length > 0) {
    const fetchPromises = toFetch.map(addr => resolveAddress(addr));
    const resolved = await Promise.all(fetchPromises);
    
    for (const result of resolved) {
      results.set(result.address, result);
    }
  }

  return results;
}

/**
 * Get display name for an address (username if available, otherwise truncated address)
 */
export async function getDisplayName(address: string, truncateLength: number = 8): Promise<string> {
  const resolved = await resolveAddress(address);
  return resolved.username || formatAddress(address, truncateLength);
}

/**
 * Get display name synchronously from cache (returns truncated address if not cached)
 */
export function getDisplayNameSync(address: string, truncateLength: number = 8): string {
  const normalized = normalizeAddress(address);
  const cached = addressCache.get(normalized);
  
  if (cached && cached.username) {
    return cached.username;
  }
  
  return formatAddress(address, truncateLength);
}

/**
 * Check if an address has been resolved and cached
 */
export function isAddressCached(address: string): boolean {
  const normalized = normalizeAddress(address);
  const cached = addressCache.get(normalized);
  return !!cached && Date.now() - cached.resolvedAt < CACHE_TTL;
}

/**
 * Pre-warm the cache with a list of addresses
 */
export async function preloadAddresses(addresses: string[]): Promise<void> {
  await resolveAddresses(addresses);
}

/**
 * Clear the address cache
 */
export function clearAddressCache(): void {
  addressCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; hitRate: number } {
  return {
    size: addressCache.size,
    hitRate: 0, // Would need additional tracking for this
  };
}
