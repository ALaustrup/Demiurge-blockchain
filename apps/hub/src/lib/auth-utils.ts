/**
 * Authentication Utilities
 * 
 * Helper functions for extracting user information from JWT tokens
 */

import { NextRequest } from 'next/server';

interface JWTPayload {
  sub: string; // User ID
  qor_id: string; // QOR ID (e.g., "username#0001")
  role?: string; // User role
  exp?: number; // Expiration timestamp
  iat?: number; // Issued at timestamp
}

/**
 * Extract JWT token from request headers
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }
  
  const match = authHeader.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

/**
 * Decode JWT token (without verification - for client-side use)
 * In production, tokens should be verified with the QOR Auth service
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (base64url)
    const payload = parts[1];
    const decoded = Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf-8');

    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Verified identity helpers. These call qor-auth to validate the token;
 * the unverified `decodeJWT` above must never be used for authorization.
 */
import { extractQorToken, verifyQorToken } from '@/lib/auth/require-qor-user';

export async function getQorIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = extractQorToken(request);
  if (!token) return null;
  const identity = await verifyQorToken(token);
  return identity?.qorId ?? null;
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token = extractQorToken(request);
  if (!token) return null;
  const identity = await verifyQorToken(token);
  return identity?.userId ?? null;
}

export async function requireAuth(request: NextRequest): Promise<{ qorId: string; userId: string } | null> {
  const token = extractQorToken(request);
  if (!token) return null;
  const identity = await verifyQorToken(token);
  return identity ? { qorId: identity.qorId, userId: identity.userId } : null;
}
