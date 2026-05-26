import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getPlantStage } from '../utils/plant.utils';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

const FRICTION_OPTIONS = [
  '✅ Estuve con él/ella y no fumó en todo el día',
  '💬 No estuve, pero me confirmó por mensaje',
  '🤔 No tengo certeza hoy',
] as const;

const UNCERTAINTY_OPTION = FRICTION_OPTIONS[2];

const ACHIEVEMENT_MILESTONES = [1, 3, 7, 15, 30, 60, 100] as const;

function getSupabase() {
  return createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );
}

// GET /api/padrino/confirmar/:token — vista pública del padrino
router.get('/confirmar/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const supabase = getSupabase();

  const { data: tokenData } = await supabase
    .from('godparent_tokens')
    .select('*, streaks(user_id, date)')
    .eq('token', token)
    .maybeSingle();

  if (!tokenData) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_NOT_FOUND', message: 'Token inválido' } };
    res.status(404).json(body);
    return;
  }

  if (new Date(tokenData.expires_at as string) < new Date()) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Este link expiró' } };
    res.status(410).json(body);
    return;
  }

  if (tokenData.used) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_USED', message: 'Ya confirmaste este día' } };
    res.status(409).json(body);
    return;
  }

  const streak = tokenData.streaks as { user_id: string; date: string };

  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name, plant_name, plant_type')
    .eq('id', streak.user_id)
    .single();

  const { count: totalDays } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', streak.user_id)
    .eq('godparent_confirmed', true)
    .eq('relapse', false);

  const daysCount = (totalDays ?? 0) + 1;
  const stage = getPlantStage(daysCount);

  const body: ApiResponse<{
    userName: string;
    plantName: string;
    plantEmoji: string;
    daysCount: number;
    frictionOptions: readonly string[];
  }> = {
    success: true,
    data: {
      userName: (userProfile?.full_name as string | null) ?? 'Tu apadrinado',
      plantName: (userProfile?.plant_name as string | null) ?? 'Mi planta',
      plantEmoji: stage.emoji,
      daysCount,
      frictionOptions: FRICTION_OPTIONS,
    },
  };
  res.json(body);
});

// PATCH /api/padrino/confirmar/:token — padrino responde
router.patch('/confirmar/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { frictionAnswer } = req.body as { frictionAnswer?: string };

  if (!frictionAnswer?.trim()) {
    const body: ApiResponse = { success: false, error: { code: 'MISSING_ANSWER', message: 'La respuesta de confirmación es requerida' } };
    res.status(400).json(body);
    return;
  }

  const supabase = getSupabase();

  const { data: tokenData } = await supabase
    .from('godparent_tokens')
    .select('*, streaks(id, user_id)')
    .eq('token', token)
    .maybeSingle();

  if (!tokenData) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_NOT_FOUND', message: 'Enlace no válido' } };
    res.status(404).json(body);
    return;
  }

  if (tokenData.used) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_USED', message: 'Este enlace ya fue usado' } };
    res.status(409).json(body);
    return;
  }

  if (new Date(tokenData.expires_at as string) < new Date()) {
    const body: ApiResponse = { success: false, error: { code: 'TOKEN_EXPIRED', message: 'El enlace expiró a medianoche' } };
    res.status(410).json(body);
    return;
  }

  const streak = tokenData.streaks as { id: string; user_id: string };

  // Marcar token como usado sin importar la respuesta
  await supabase
    .from('godparent_tokens')
    .update({ used: true, friction_answer: frictionAnswer.trim() })
    .eq('token', token);

  // Opción 3 — incertidumbre: no confirma pero tampoco fraude
  if (frictionAnswer.trim() === UNCERTAINTY_OPTION) {
    const body: ApiResponse<{ confirmed: boolean; message: string }> = {
      success: true,
      data: { confirmed: false, message: 'Gracias por tu honestidad' },
    };
    res.json(body);
    return;
  }

  // Confirmar el día en streaks
  await supabase
    .from('streaks')
    .update({ godparent_confirmed: true, godparent_confirmed_at: new Date().toISOString() })
    .eq('id', streak.id);

  // Contar días totales confirmados del usuario
  const { count: totalDays } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', streak.user_id)
    .eq('godparent_confirmed', true)
    .eq('relapse', false);

  const daysCount = totalDays ?? 0;

  // Verificar si se activó un logro nuevo
  let newAchievement: string | null = null;
  const milestone = ACHIEVEMENT_MILESTONES.find(m => m === daysCount);

  if (milestone) {
    const achievementKey = `day_${milestone}`;
    const { error: achError } = await supabase
      .from('achievements')
      .insert({ user_id: streak.user_id, achievement_key: achievementKey })
      .select()
      .single();

    if (!achError) {
      newAchievement = achievementKey;
    }
  }

  const body: ApiResponse<{ confirmed: boolean; daysCount: number; newAchievement: string | null }> = {
    success: true,
    data: { confirmed: true, daysCount, newAchievement },
  };
  res.json(body);
});

export default router;
