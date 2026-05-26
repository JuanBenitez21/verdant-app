import { Router, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { getScoreLevel } from '@verdant/shared';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

// Todas las rutas de admin requieren auth + rol admin
router.use(requireAuth, requireAdmin);

// GET /api/admin/metrics
router.get('/metrics', async (_req: AuthRequest, res: Response) => {
  const supabase = getSupabase();
  const TRM = 4200;
  const ROI_PER_USER_USD = 2800;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().split('T')[0]!;

  // Usuarios activos = con al menos un streak en los últimos 30 días
  const { data: activeUsersData } = await supabase
    .from('streaks')
    .select('user_id')
    .gte('date', cutoff)
    .eq('godparent_confirmed', true);

  const activeUserSet = new Set(activeUsersData?.map((r: { user_id: string }) => r.user_id) ?? []);
  const activeUsers = activeUserSet.size;

  // Score promedio
  const { data: scoresData } = await supabase
    .from('scores')
    .select('total_score')
    .gte('date', cutoff);

  const scores = scoresData?.map((s: { total_score: number }) => s.total_score) ?? [];
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : 0;

  // Días sin fumar acumulados
  const { count: totalDaysClean } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
    .eq('godparent_confirmed', true)
    .eq('relapse', false);

  const estimatedRoiCop = Math.round(activeUsers * ROI_PER_USER_USD * TRM);

  const body: ApiResponse = {
    success: true,
    data: { activeUsers, avgScore, totalDaysClean: totalDaysClean ?? 0, estimatedRoiCop },
  };
  res.json(body);
});

// GET /api/admin/users
router.get('/users', async (_req: AuthRequest, res: Response) => {
  const supabase = getSupabase();

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, plant_name, plant_type');

  if (!users || users.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const enriched = await Promise.all(
    users.map(async (u: { id: string; full_name: string; plant_name: string; plant_type: string }) => {
      const today = new Date().toISOString().split('T')[0]!;

      const { count: confirmedDays } = await supabase
        .from('streaks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.id)
        .eq('godparent_confirmed', true)
        .eq('relapse', false);

      // Racha actual (días consecutivos hasta hoy)
      const { data: recentStreaks } = await supabase
        .from('streaks')
        .select('date')
        .eq('user_id', u.id)
        .eq('godparent_confirmed', true)
        .eq('relapse', false)
        .order('date', { ascending: false })
        .limit(120);

      let rachaActual = 0;
      const dates = recentStreaks?.map((s: { date: string }) => s.date) ?? [];
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        if (dates[i] === expected.toISOString().split('T')[0]) {
          rachaActual++;
        } else break;
      }

      const { data: latestScore } = await supabase
        .from('scores')
        .select('total_score')
        .eq('user_id', u.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const totalScore = (latestScore?.total_score as number | null) ?? 0;
      const level = getScoreLevel(totalScore);

      return {
        id: u.id,
        fullName: u.full_name,
        plantName: u.plant_name,
        diasRacha: rachaActual,
        diasTotales: confirmedDays ?? 0,
        score: totalScore,
        scoreLabel: level.label,
      };
    }),
  );

  res.json({ success: true, data: enriched });
});

// GET /api/admin/alerts
router.get('/alerts', async (_req: AuthRequest, res: Response) => {
  const supabase = getSupabase();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().split('T')[0]!;

  const { data: alerts } = await supabase
    .from('scores')
    .select('user_id, date, total_score, wearable_hr_pts, wearable_steps_pts, wearable_sleep_pts, godparent_pts, self_report_pts, coherence_pts')
    .eq('incoherence_flag', true)
    .gte('date', cutoff)
    .order('date', { ascending: false });

  if (!alerts || alerts.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  // Obtener nombres de usuarios
  const userIds = [...new Set(alerts.map((a: { user_id: string }) => a.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', userIds);

  const userMap = new Map(
    (users ?? []).map((u: { id: string; full_name: string }) => [u.id, u.full_name])
  );

  const enriched = alerts.map((a: {
    user_id: string; date: string; total_score: number;
    wearable_hr_pts: number; wearable_steps_pts: number; wearable_sleep_pts: number;
    godparent_pts: number; self_report_pts: number; coherence_pts: number;
  }) => {
    const wearableTotal = a.wearable_hr_pts + a.wearable_steps_pts + a.wearable_sleep_pts;
    const socialTotal = a.godparent_pts + a.self_report_pts;
    const diff = Math.abs(wearableTotal - socialTotal);
    return {
      userId: a.user_id,
      userName: userMap.get(a.user_id) ?? 'Usuario desconocido',
      date: a.date,
      totalScore: a.total_score,
      wearableTotal,
      socialTotal,
      diff,
      severity: diff > 50 ? 'alta' : 'media',
    };
  });

  res.json({ success: true, data: enriched });
});

export default router;
