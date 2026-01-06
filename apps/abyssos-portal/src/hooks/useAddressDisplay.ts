/**
 * useAddressDisplay Hook
 * 
 * React hook for resolving blockchain addresses to usernames.
 * Provides automatic caching and batch resolution.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  resolveAddress,
  resolveAddresses,
  getDisplayNameSync,
  formatAddress,
  normalizeAddress,
  type ResolvedAddress,
} from '../lib/addressResolver';

// Re-export utilities for convenience
export { formatAddress, normalizeAddress };

interface UseAddressDisplayResult {
  /** Display name (username if available, truncated address otherwise) */
  displayName: string;
  /** Full username if available */
  username: string | null;
  /** Handle if available */
  handle: string | null;
  /** Whether this is an Archon */
  isArchon: boolean;
  /** Whether the address is currently being resolved */
  isLoading: boolean;
  /** The normalized address */
  address: string;
  /** Formatted/truncated address */
  formattedAddress: string;
}

/**
 * Hook to resolve a single address to a display name
 */
export function useAddressDisplay(
  address: string | null | undefined,
  options?: { truncateLength?: number }
): UseAddressDisplayResult {
  const truncateLength = options?.truncateLength ?? 8;
  const [resolved, setResolved] = useState<ResolvedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setResolved(null);
      return;
    }

    const normalized = normalizeAddress(address);
    
    // Try sync first (from cache)
    const syncName = getDisplayNameSync(address, truncateLength);
    if (syncName !== formatAddress(address, truncateLength)) {
      // We have a cached username
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    // Resolve async
    resolveAddress(address)
      .then(result => {
        setResolved(result);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to resolve address:', error);
        setIsLoading(false);
      });
  }, [address, truncateLength]);

  const normalized = address ? normalizeAddress(address) : '';
  const formatted = address ? formatAddress(address, truncateLength) : '';

  return {
    displayName: resolved?.username || formatted,
    username: resolved?.username || null,
    handle: resolved?.handle || null,
    isArchon: resolved?.isArchon || false,
    isLoading,
    address: normalized,
    formattedAddress: formatted,
  };
}

interface UseBatchAddressDisplayResult {
  /** Map of address -> display info */
  addresses: Map<string, UseAddressDisplayResult>;
  /** Whether any address is currently being resolved */
  isLoading: boolean;
  /** Resolve additional addresses */
  resolve: (addresses: string[]) => Promise<void>;
}

/**
 * Hook to resolve multiple addresses at once
 */
export function useBatchAddressDisplay(
  addresses: string[],
  options?: { truncateLength?: number }
): UseBatchAddressDisplayResult {
  const truncateLength = options?.truncateLength ?? 8;
  const [resolvedMap, setResolvedMap] = useState<Map<string, ResolvedAddress>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const previousAddresses = useRef<string[]>([]);

  const resolve = useCallback(async (newAddresses: string[]) => {
    if (newAddresses.length === 0) return;

    setIsLoading(true);
    try {
      const resolved = await resolveAddresses(newAddresses);
      setResolvedMap(prev => {
        const updated = new Map(prev);
        resolved.forEach((value, key) => updated.set(key, value));
        return updated;
      });
    } catch (error) {
      console.error('Failed to batch resolve addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Resolve addresses when they change
  useEffect(() => {
    // Find new addresses that haven't been resolved
    const normalized = addresses.map(normalizeAddress);
    const newAddresses = normalized.filter(
      addr => !resolvedMap.has(addr) && !previousAddresses.current.includes(addr)
    );

    if (newAddresses.length > 0) {
      previousAddresses.current = [...previousAddresses.current, ...newAddresses];
      resolve(newAddresses);
    }
  }, [addresses, resolve, resolvedMap]);

  // Build result map
  const resultMap = new Map<string, UseAddressDisplayResult>();
  
  for (const address of addresses) {
    const normalized = normalizeAddress(address);
    const resolved = resolvedMap.get(normalized);
    const formatted = formatAddress(address, truncateLength);

    resultMap.set(normalized, {
      displayName: resolved?.username || formatted,
      username: resolved?.username || null,
      handle: resolved?.handle || null,
      isArchon: resolved?.isArchon || false,
      isLoading: !resolved,
      address: normalized,
      formattedAddress: formatted,
    });
  }

  return {
    addresses: resultMap,
    isLoading,
    resolve,
  };
}

/**
 * Hook to get a display function for addresses
 * Useful when you need to format many addresses in render
 */
export function useAddressFormatter(options?: { truncateLength?: number }) {
  const truncateLength = options?.truncateLength ?? 8;
  const [resolvedMap, setResolvedMap] = useState<Map<string, ResolvedAddress>>(new Map());

  const format = useCallback((address: string): string => {
    const normalized = normalizeAddress(address);
    const resolved = resolvedMap.get(normalized);
    return resolved?.username || formatAddress(address, truncateLength);
  }, [resolvedMap, truncateLength]);

  const preload = useCallback(async (addresses: string[]) => {
    const resolved = await resolveAddresses(addresses);
    setResolvedMap(prev => {
      const updated = new Map(prev);
      resolved.forEach((value, key) => updated.set(key, value));
      return updated;
    });
  }, []);

  return { format, preload };
}
