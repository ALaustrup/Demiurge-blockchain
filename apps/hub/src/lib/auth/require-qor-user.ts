/**
 * Server-side QOR identity verification for hub API routes and middleware.
 *
 * Extracts the bearer token (Authorization header or `qor_token` cookie) and
 * validates it against the qor-auth service (`GET {QOR_AUTH_URL}/api/v1/profile`).
 * The identity is derived from the validated profile only, never from
 * client-supplied headers/query params (e.g. `x-qor-id`, `?qorId=`).
 *
 * This module is edge-safe (no Node-only imports) so `middleware.ts` can use it.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface QorIdentity {
  qorId: string;
  userId: string;
  role: string;
  /** On-chain address linked to the account (null if none linked yet). */
  address: string | null;
}

/**
 * Resolve the qor-auth API base, normalised to end with `/api/v1`.
 * Accepts either `http://host:8080` or `http://host:8080/api/v1`.
 */
export function getQorAuthApiBase(): string {
  const raw =
    process.env.QOR_AUTH_URL ||
    process.env.NEXT_PUBLIC_QOR_AUTH_URL ||
    'http://localhost:8080/api/v1';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

/** Extract a bearer token from the Authorization header or the `qor_token` cookie. */
export function extractQorToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1].trim()) return match[1].trim();
  }
  const cookie = req.cookies.get('qor_token')?.value;
  return cookie && cookie.trim() ? cookie.trim() : null;
}

/**
 * Validate a token with the qor-auth service. Returns null on any failure
 * (network error, non-2xx, malformed body) — fail closed.
 */
export async function verifyQorToken(token: string): Promise<QorIdentity | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${getQorAuthApiBase()}/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data.qor_id !== 'string' || !data.qor_id) return null;
    const userId = data.id != null ? String(data.id) : '';
    if (!userId) return null;
    return {
      qorId: data.qor_id,
      userId,
      role: typeof data.role === 'string' ? data.role : 'user',
      address: data.on_chain?.address ?? data.on_chain_address ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated QOR user. Returns the identity, or a 401 Response
 * that the route should return as-is.
 */
export async function requireQorUser(req: NextRequest): Promise<QorIdentity | NextResponse> {
  const token = extractQorToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const identity = await verifyQorToken(token);
  if (!identity) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
  return identity;
}

/** Type guard: did `requireQorUser` fail? */
export function isAuthFailure(result: QorIdentity | NextResponse): result is NextResponse {
  return result instanceof Response;
}

/** True for roles allowed to use admin-only endpoints. */
export function isAdminRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'god';
}
