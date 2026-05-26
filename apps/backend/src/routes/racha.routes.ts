import { Router, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { sendGodparentEmail } from '../services/email.service';
import { getPlantStage } from '../utils/plant.utils';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

function midnightColombia(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year!, month! - 1, day! + 1, 5, 0, 0, 0));
  return d.toISOString();
}

router.post('/daily', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { date } = req.body as { date?: string };
  const today = date ?? new Date().toISOString().split('T')[0]!;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('streaks').select('id').eq('user_id', userId).eq('date', today).maybeSingle();

  if (existing) {
    res.status(409).json({ success: false, error: { code: 'ALREADY_REPORTED', message: 'Ya reportaste hoy' } });
    return;
  }

  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .insert({ user_id: userId, date: today, self_reported: true, relapse: false })
    .select().single();

  if (streakError || !streak) {
    res.status(500).json({ success: false, error: { code: 'STREAK_ERROR', message: 'Error al registrar el día' } });
    return;
  }

  const { data: userProfile } = await supabase
    .from('users').select('full_name, godparent_email').eq('id', userId).single();

  const { count: totalDays } = await supabase
    .from('streaks').select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('godparent_confirmed', true).eq('relapse', false);

  const daysCount = (totalDays ?? 0) + 1;
  const token = crypto.randomUUID().replace(/-/g, '');

  await supabase.from('godparent_tokens').insert({
    streak_id: streak.id, token, expires_at: midnightColombia(today),
  });

  const godparentEmail = userProfile?.godparent_email ?? null;
  const userName = (userProfile?.full_name as string | null) ?? 'Tu apadrinado';

  if (godparentEmail) {
    sendGodparentEmail(godparentEmail as string, userName, token, daysCount).catch((err: unknown) => {
      console.error('[racha] Error email padrino:', err);
    });
  }

  console.log(`[racha] ✅ ${userName} reportó día ${daysCount} | token: ${token}`);

  const body: ApiResponse<{ streakId: string; daysCount: number; plantStage: string; godparentToken: string }> = {
    success: true,
    data: { streakId: streak.id as string, daysCount, plantStage: getPlantStage(daysCount).key, godparentToken: token },
  };
  res.status(201).json(body);
});

router.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0]!;

  const { data: streaks, count } = await supabase
    .from('streaks').select('*', { count: 'exact' })
    .eq('user_id', userId).eq('godparent_confirmed', true).eq('relapse', false)
    .order('date', { ascending: false });

  const hasReportedToday = streaks?.some((s: { date: string }) => s.date === today) ?? false;

  res.json({ success: true, data: { totalDays: count ?? 0, hasReportedToday, streaks: streaks ?? [] } });
});

export default router;
