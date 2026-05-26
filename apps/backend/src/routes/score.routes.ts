import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { getScoreLevel } from '@verdant/shared';
import { calculateScore } from '../services/score.service';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

function getSupabase() {
  return createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );
}

// GET /api/score/current — score más reciente; si no hay, calcula uno
router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0]!;

  const { data: existing } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const level = getScoreLevel(existing.total_score as number);
    const body: ApiResponse = {
      success: true,
      data: {
        wearableHrPts: existing.wearable_hr_pts,
        wearableStepsPts: existing.wearable_steps_pts,
        wearableSleepPts: existing.wearable_sleep_pts,
        godparentPts: existing.godparent_pts,
        selfReportPts: existing.self_report_pts,
        coherencePts: existing.coherence_pts,
        totalScore: existing.total_score,
        incoherenceFlag: existing.incoherence_flag,
        level,
      },
    };
    res.json(body);
    return;
  }

  // Sin score previo — calcular para hoy
  const components = await calculateScore(userId, today);
  const level = getScoreLevel(components.totalScore);

  const body: ApiResponse = {
    success: true,
    data: { ...components, level },
  };
  res.json(body);
});

// GET /api/score/me — alias que mantiene compatibilidad
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  res.redirect('/api/score/current');
});

export default router;
