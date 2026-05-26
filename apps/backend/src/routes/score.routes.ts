import { Router, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { getScoreLevel } from '@verdant/shared';
import { calculateScore } from '../services/score.service';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0]!;

  const { data: existing } = await supabase
    .from('scores').select('*').eq('user_id', userId)
    .order('date', { ascending: false }).limit(1).maybeSingle();

  if (existing) {
    const level = getScoreLevel(existing.total_score as number);
    res.json({
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
    });
    return;
  }

  const components = await calculateScore(userId, today);
  const level = getScoreLevel(components.totalScore);
  res.json({ success: true, data: { ...components, level } });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  res.redirect(307, '/api/score/current');
});

export default router;
