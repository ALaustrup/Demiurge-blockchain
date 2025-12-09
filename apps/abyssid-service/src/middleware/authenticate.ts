/**
 * Authentication Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';

export function getSessionId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function getUserIdFromSession(sessionId: string): Promise<number | null> {
  const db = getDb();
  const session = db.prepare('SELECT user_id FROM abyssid_sessions WHERE id = ? AND expires_at > datetime("now")').get(sessionId) as { user_id: number } | undefined;
  return session?.user_id ?? null;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  getUserIdFromSession(sessionId).then(userId => {
    if (!userId) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    (req as any).userId = userId;
    next();
  }).catch(() => {
    res.status(500).json({ error: 'Internal server error' });
  });
}

