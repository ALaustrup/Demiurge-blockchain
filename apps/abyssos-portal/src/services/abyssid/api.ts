/**
 * AbyssID Server API Integration
 * 
 * Provides safe, non-blocking hooks for server-side AbyssID operations.
 * All functions gracefully degrade if the server is unavailable.
 */

export interface AbyssProfile {
  username: string;
  publicKey: string;
  address?: string;
  createdAt?: number;
}

// Configurable API base URL (can be set via environment variable)
const ABYSSID_API_BASE = import.meta.env.VITE_ABYSSID_API_BASE || '';

/**
 * Register an AbyssID on the server
 * 
 * This is a non-blocking operation. If the server is unavailable,
 * the function will log a warning but not throw an error.
 */
export async function registerAbyssIdOnServer(session: {
  username: string;
  publicKey: string;
  sessionId: string;
}): Promise<void> {
  if (!ABYSSID_API_BASE) {
    // Server not configured, silently skip
    return;
  }

  try {
    const response = await fetch(`${ABYSSID_API_BASE}/api/abyssid/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: session.username,
        publicKey: session.publicKey,
        sessionId: session.sessionId,
      }),
    });

    if (!response.ok) {
      console.warn(`AbyssID server registration failed: ${response.status}`);
    }
  } catch (error) {
    // Non-blocking: log warning but don't throw
    console.warn('AbyssID server unavailable, continuing with local-only mode:', error);
  }
}

/**
 * Fetch an AbyssID profile from the server
 * 
 * Returns null if the server is unavailable or the profile is not found.
 */
export async function fetchAbyssProfile(username: string): Promise<AbyssProfile | null> {
  if (!ABYSSID_API_BASE) {
    return null;
  }

  try {
    const response = await fetch(`${ABYSSID_API_BASE}/api/abyssid/profile/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.warn(`AbyssID profile fetch failed: ${response.status}`);
      return null;
    }

    const profile = await response.json() as AbyssProfile;
    return profile;
  } catch (error) {
    // Non-blocking: return null on error
    console.warn('AbyssID server unavailable:', error);
    return null;
  }
}

/**
 * Check if the AbyssID server is available
 */
export async function checkServerAvailability(): Promise<boolean> {
  if (!ABYSSID_API_BASE) {
    return false;
  }

  try {
    const response = await fetch(`${ABYSSID_API_BASE}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

