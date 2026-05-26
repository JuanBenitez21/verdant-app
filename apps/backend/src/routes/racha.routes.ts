import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { sendGodparentEmail } from '../services/email.service';
import { getPlantStage } from '../utils/plant.utils';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

function getSupabase() {
  return createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );
}

// Medianoche del día dado en zona Colombia (UTC-5)
function midnightColombia(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Medianoche Colombia = 05:00 UTC del día siguiente
  const d = new Date(Date.UTC(year!, month! - 1, day! + 1, 5, 0, 0, 0));
  return d.toISOString();
}

// POST /api/rachas/daily — usuario reporta día limpio
router.post('/daily', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { date } = req.body as { date?: string };

  const today = date ?? new Date().toISOString().split('T')[0]!;

  const supabase = getSupabase();

  // 1. Verificar si ya reportó hoy
  const { data: existing } = await supabase
    .from('streaks')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    const body: ApiResponse = {
      success: false,
      error: { code: 'ALREADY_REPORTED', message: 'Ya reportaste hoy' },
    };
    res.status(409).json(body);
    return;
  }

  // 2. Insertar racha
  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .insert({ user_id: userId, date: today, self_reported: true, relapse: false })
    .select()
    .single();

  if (streakError || !streak) {
    const body: ApiResponse = { success: false, error: { code: 'STREAK_ERROR', message: 'Error al registrar el día' } };
    res.status(500).json(body);
    return;
  }

  // 3. Obtener perfil del usuario (nombre y godparent_email)
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name, godparent_email')
    .eq('id', userId)
    .single();

  // 4. Contar días totales confirmados
  const { count: totalDays } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('godparent_confirmed', true)
    .eq('relapse', false);

  const daysCount = (totalDays ?? 0) + 1;

  // 5. Generar token único y calcular expiración
  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = midnightColombia(today);

  // 6. Insertar token de padrino
  await supabase.from('godparent_tokens').insert({
    streak_id: streak.id,
    token,
    expires_at: expiresAt,
  });

  // 7. Enviar email al padrino
  const godparentEmail = userProfile?.godparent_email ?? null;
  const userName = userProfile?.full_name ?? 'Tu apadrinado';

  if (godparentEmail) {
    sendGodparentEmail(godparentEmail, userName, token, daysCount).catch((err: unknown) => {
      console.error('[racha.routes] Error enviando email al padrino:', err);
    });
  } else {
    console.log('[racha.routes] Usuario sin padrino asignado, email omitido');
  }

  // 8. Calcular etapa de planta
  const plantStage = getPlantStage(daysCount);

  const body: ApiResponse<{ streakId: string; daysCount: number; plantStage: string; godparentToken: string }> = {
    success: true,
    data: {
      streakId: streak.id as string,
      daysCount,
      plantStage: plantStage.key,
      godparentToken: token,
    },
  };
  res.status(201).json(body);
});

// GET /api/rachas/summary — resumen de racha del usuario
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const supabase = getSupabase();

  const { data: streaks, count } = await supabase
    .from('streaks')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('godparent_confirmed', true)
    .eq('relapse', false)
    .order('date', { ascending: false });

  const today = new Date().toISOString().split('T')[0]!;
  const hasReportedToday = streaks?.some((s: { date: string }) => s.date === today) ?? false;

  const body: ApiResponse<{ totalDays: number; hasReportedToday: boolean; streaks: unknown[] }> = {
    success: true,
    data: { totalDays: count ?? 0, hasReportedToday, streaks: streaks ?? [] },
  };
  res.json(body);
});

export default router;
