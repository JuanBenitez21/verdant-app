import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

function getSupabase() {
  return createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );
}

function midnightToday(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// POST /api/rachas/daily — usuario reporta día limpio
router.post('/daily', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const today = new Date().toISOString().split('T')[0];

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('streaks')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    const body: ApiResponse = { success: false, error: { code: 'ALREADY_REPORTED', message: 'Ya reportaste el día de hoy' } };
    res.status(409).json(body);
    return;
  }

  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .insert({ user_id: userId, date: today, self_reported: true })
    .select()
    .single();

  if (streakError || !streak) {
    const body: ApiResponse = { success: false, error: { code: 'STREAK_ERROR', message: 'Error al registrar el día' } };
    res.status(500).json(body);
    return;
  }

  const token = uuidv4().replace(/-/g, '');
  await supabase.from('godparent_tokens').insert({
    streak_id: streak.id,
    token,
    expires_at: midnightToday(),
  });

  // El servicio de email se dispara aquí en producción
  // Por ahora devolvemos el token para testing

  const body: ApiResponse<{ streakId: string; godparentToken: string }> = {
    success: true,
    data: { streakId: streak.id as string, godparentToken: token },
  };
  res.status(201).json(body);
});

// GET /api/rachas/summary — resumen de racha del usuario
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const supabase = getSupabase();

  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('godparent_confirmed', true)
    .eq('relapse', false)
    .order('date', { ascending: false });

  const totalDays = streaks?.length ?? 0;

  const body: ApiResponse<{ totalDays: number; streaks: unknown[] }> = {
    success: true,
    data: { totalDays, streaks: streaks ?? [] },
  };
  res.json(body);
});

export default router;
