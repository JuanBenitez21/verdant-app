import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { getScoreLevel } from '@verdant/shared';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

function getSupabase() {
  return createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );
}

// GET /api/score/me — score actual del usuario autenticado
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const supabase = getSupabase();

  const { data: score } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!score) {
    const body: ApiResponse<{ totalScore: number; level: unknown }> = {
      success: true,
      data: { totalScore: 0, level: getScoreLevel(0) },
    };
    res.json(body);
    return;
  }

  const level = getScoreLevel(score.total_score as number);
  const body: ApiResponse = { success: true, data: { ...score, level } };
  res.json(body);
});

export default router;
