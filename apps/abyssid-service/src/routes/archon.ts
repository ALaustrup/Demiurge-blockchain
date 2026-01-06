/**
 * Archon Routes
 * 
 * PHASE OMEGA PART VI: Backend routes for Archon state and directives
 */

import { Router, Request, Response } from 'express';
import { getArchonState, triggerAscensionEvent, getDirectives, getDiagnostics, getA0Directive } from '../services/archonState.js';

const router: Router = Router();

/**
 * GET /api/archon/state
 * Get current Archon state from the node
 */
router.get('/state', async (_req: Request, res: Response) => {
  try {
    const state = await getArchonState();
    res.json(state);
  } catch (error: any) {
    console.error('[Archon Routes] Failed to get state:', error);
    res.status(500).json({
      error: 'Failed to fetch Archon state',
      message: error.message,
    });
  }
});

/**
 * POST /api/archon/ascend
 * Trigger Ascension Event (A0 directive)
 */
router.post('/ascend', async (_req: Request, res: Response) => {
  try {
    const result = await triggerAscensionEvent();
    res.json({
      success: result.success,
      directive: result.directive,
      message: 'Ascension event triggered',
    });
  } catch (error: any) {
    console.error('[Archon Routes] Failed to trigger ascension:', error);
    res.status(500).json({
      error: 'Failed to trigger ascension event',
      message: error.message,
    });
  }
});

/**
 * GET /api/archon/directives
 * Get active Archon directives
 */
router.get('/directives', async (_req: Request, res: Response) => {
  try {
    const directives = await getDirectives();
    res.json(directives);
  } catch (error: any) {
    console.error('[Archon Routes] Failed to get directives:', error);
    res.status(500).json({
      error: 'Failed to fetch directives',
      message: error.message,
    });
  }
});

/**
 * GET /api/archon/diagnostics
 * Get diagnostic test results
 */
router.get('/diagnostics', async (_req: Request, res: Response) => {
  try {
    const diagnostics = await getDiagnostics();
    res.json(diagnostics);
  } catch (error: any) {
    console.error('[Archon Routes] Failed to get diagnostics:', error);
    res.status(500).json({
      error: 'Failed to fetch diagnostics',
      message: error.message,
    });
  }
});

/**
 * GET /api/archon/a0
 * Get A0 Directive status
 */
router.get('/a0', async (_req: Request, res: Response) => {
  try {
    const a0 = await getA0Directive();
    res.json(a0);
  } catch (error: any) {
    console.error('[Archon Routes] Failed to get A0 directive:', error);
    res.status(500).json({
      error: 'Failed to fetch A0 directive',
      message: error.message,
    });
  }
});

export default router;
