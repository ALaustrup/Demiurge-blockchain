/**
 * Archon API Client
 * 
 * PHASE OMEGA PART VI: API layer for fetching Archon state
 */

import type { ArchonState } from './ArchonPresence';

const ARCHON_API_BASE = '/api/archon';

/**
 * Fetch current Archon state from the node
 */
export async function fetchArchonState(): Promise<ArchonState> {
  try {
    const response = await fetch(`${ARCHON_API_BASE}/state`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Archon state: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as ArchonState;
  } catch (error) {
    console.error('[Archon API] Failed to fetch state:', error);
    throw error;
  }
}

/**
 * Trigger Ascension Event (A0 directive)
 */
export async function triggerAscension(): Promise<{ success: boolean; directive: string }> {
  try {
    const response = await fetch(`${ARCHON_API_BASE}/ascend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger ascension: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Archon API] Failed to trigger ascension:', error);
    throw error;
  }
}

/**
 * Get Archon directives
 */
export async function getDirectives(): Promise<Array<{ directive: string; priority: number; description: string }>> {
  try {
    const response = await fetch(`${ARCHON_API_BASE}/directives`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch directives: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Archon API] Failed to fetch directives:', error);
    throw error;
  }
}

/**
 * Get diagnostic results
 */
export async function getDiagnostics(): Promise<Array<{
  id: string;
  category: string;
  name: string;
  result: string;
  timestamp: number;
}>> {
  try {
    const response = await fetch(`${ARCHON_API_BASE}/diagnostics`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch diagnostics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Archon API] Failed to fetch diagnostics:', error);
    throw error;
  }
}
