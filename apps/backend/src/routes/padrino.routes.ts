import { Router, Request, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { getPlantStage } from '../utils/plant.utils';
import { sendPushNotification } from '../services/notification.service';
import type { ApiResponse } from '@verdant/shared';

const router = Router();

const FRICTION_OPTIONS = [
  '✅ Estuve con él/ella y no fumó en todo el día',
  '💬 No estuve, pero me confirmó por mensaje',
  '🤔 No tengo certeza hoy',
] as const;

const UNCERTAINTY_OPTION = FRICTION_OPTIONS[2];
const ACHIEVEMENT_MILESTONES = [1, 3, 7, 15, 30, 60, 100] as const;

// GET /api/padrino/mis-pendientes — confirmaciones pendientes para el usuario actual como padrino
router.get('/mis-pendientes', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0]!;

  // Obtener email del usuario autenticado
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const myEmail = authUser?.user?.email;

  if (!myEmail) {
    res.json({ success: true, data: [] });
    return;
  }

  // Buscar apadrinados: usuarios cuyo godparent_email es el email actual
  const { data: apadrinados } = await supabase
    .from('users')
    .select('id, full_name, plant_name, plant_type')
    .eq('godparent_email', myEmail);

  if (!apadrinados || apadrinados.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const apadrinadoIds = apadrinados.map((u: { id: string }) => u.id);

  // Buscar streaks de hoy sin confirmar para esos apadrinados
  const { data: streaks } = await supabase
    .from('streaks')
    .select('id, user_id')
    .in('user_id', apadrinadoIds)
    .eq('date', today)
    .eq('self_reported', true)
    .eq('godparent_confirmed', false)
    .eq('relapse', false);

  if (!streaks || streaks.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const streakIds = streaks.map((s: { id: string }) => s.id);

  // Obtener tokens activos para esos streaks
  const { data: tokens } = await supabase
    .from('godparent_tokens')
    .select('streak_id, token')
    .in('streak_id', streakIds)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString());

  if (!tokens || tokens.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  // Construir respuesta: unir apadrinado + streak + token
  const tokenByStreak = new Map(tokens.map((t: { streak_id: string; token: string }) => [t.streak_id, t.token]));
  const userById = new Map(apadrinados.map((u: { id: string; full_name: string; plant_name: string; plant_type: string }) => [u.id, u]));

  const pending = streaks
    .filter((s: { id: string }) => tokenByStreak.has(s.id))
    .map((s: { id: string; user_id: string }) => {
      const user = userById.get(s.user_id)!;
      const token = tokenByStreak.get(s.id)!;

      // Contar días confirmados del apadrinado
      return { userId: s.user_id, token, userName: user.full_name, plantName: user.plant_name };
    });

  // Enriquecer con días totales de cada apadrinado
  const enriched = await Promise.all(
    pending.map(async (item: { userId: string; token: string; userName: string; plantName: string }) => {
      const { count } = await supabase
        .from('streaks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', item.userId)
        .eq('godparent_confirmed', true)
        .eq('relapse', false);

      const daysCount = (count ?? 0) + 1;
      return {
        token: item.token,
        userName: item.userName,
        plantName: item.plantName,
        plantEmoji: getPlantStage(daysCount).emoji,
        daysCount,
      };
    }),
  );

  console.log(`[padrino] ${myEmail} tiene ${enriched.length} confirmación(es) pendiente(s)`);
  res.json({ success: true, data: enriched });
});

router.get('/confirmar/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const supabase = getSupabase();

  const { data: tokenData } = await supabase
    .from('godparent_tokens').select('*, streaks(user_id, date)')
    .eq('token', token).maybeSingle();

  if (!tokenData) {
    res.status(404).json({ success: false, error: { code: 'TOKEN_NOT_FOUND', message: 'Token inválido' } });
    return;
  }
  if (new Date(tokenData.expires_at as string) < new Date()) {
    res.status(410).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Este link expiró' } });
    return;
  }
  if (tokenData.used) {
    res.status(409).json({ success: false, error: { code: 'TOKEN_USED', message: 'Ya confirmaste este día' } });
    return;
  }

  const streak = tokenData.streaks as { user_id: string; date: string };

  const { data: userProfile } = await supabase
    .from('users').select('full_name, plant_name').eq('id', streak.user_id).single();

  const { count: totalDays } = await supabase
    .from('streaks').select('*', { count: 'exact', head: true })
    .eq('user_id', streak.user_id).eq('godparent_confirmed', true).eq('relapse', false);

  const daysCount = (totalDays ?? 0) + 1;

  const body: ApiResponse = {
    success: true,
    data: {
      userName: (userProfile?.full_name as string | null) ?? 'Tu apadrinado',
      plantName: (userProfile?.plant_name as string | null) ?? 'Mi planta',
      plantEmoji: getPlantStage(daysCount).emoji,
      daysCount,
      frictionOptions: FRICTION_OPTIONS,
    },
  };
  res.json(body);
});

router.patch('/confirmar/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { frictionAnswer } = req.body as { frictionAnswer?: string };

  if (!frictionAnswer?.trim()) {
    res.status(400).json({ success: false, error: { code: 'MISSING_ANSWER', message: 'La respuesta es requerida' } });
    return;
  }

  const supabase = getSupabase();

  const { data: tokenData } = await supabase
    .from('godparent_tokens').select('*, streaks(id, user_id)')
    .eq('token', token).maybeSingle();

  if (!tokenData) {
    res.status(404).json({ success: false, error: { code: 'TOKEN_NOT_FOUND', message: 'Enlace no válido' } });
    return;
  }
  if (tokenData.used) {
    res.status(409).json({ success: false, error: { code: 'TOKEN_USED', message: 'Este enlace ya fue usado' } });
    return;
  }
  if (new Date(tokenData.expires_at as string) < new Date()) {
    res.status(410).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'El enlace expiró a medianoche' } });
    return;
  }

  const streak = tokenData.streaks as { id: string; user_id: string };

  await supabase.from('godparent_tokens')
    .update({ used: true, friction_answer: frictionAnswer.trim() }).eq('token', token);

  if (frictionAnswer.trim() === UNCERTAINTY_OPTION) {
    console.log(`[padrino] ⚠️  Respuesta incierta para token ${token}`);
    res.json({ success: true, data: { confirmed: false, message: 'Gracias por tu honestidad' } });
    return;
  }

  await supabase.from('streaks')
    .update({ godparent_confirmed: true, godparent_confirmed_at: new Date().toISOString() })
    .eq('id', streak.id);

  const { count: totalDays } = await supabase
    .from('streaks').select('*', { count: 'exact', head: true })
    .eq('user_id', streak.user_id).eq('godparent_confirmed', true).eq('relapse', false);

  const daysCount = totalDays ?? 0;
  let newAchievement: string | null = null;
  const milestone = ACHIEVEMENT_MILESTONES.find(m => m === daysCount);

  if (milestone) {
    const { error: achError } = await supabase
      .from('achievements')
      .insert({ user_id: streak.user_id, achievement_key: `day_${milestone}` });

    if (!achError) {
      newAchievement = `day_${milestone}`;

      // Auto-publicar en el muro de comunidad
      const { data: userProfile } = await supabase
        .from('users')
        .select('full_name, institution_id')
        .eq('id', streak.user_id)
        .maybeSingle();

      if (userProfile) {
        const MILESTONE_EMOJIS: Record<number, string> = {
          1: '🌱', 3: '🌿', 7: '💪', 15: '🌬️', 30: '🌸', 60: '❤️', 100: '👑',
        };
        await supabase.from('community_posts').insert({
          user_id: streak.user_id,
          institution_id: userProfile.institution_id,
          post_type: 'achievement',
          content: `🏆 ${userProfile.full_name} acaba de completar ${milestone} ${milestone === 1 ? 'día' : 'días'} sin fumar`,
          emoji: MILESTONE_EMOJIS[milestone] ?? '🌿',
          likes_count: 0,
        });
      }
    }
  }

  console.log(`[padrino] ✅ Día confirmado — ${daysCount} días totales${newAchievement ? ` | logro: ${newAchievement}` : ''}`);

  // Enviar push notification al usuario
  const { data: userRow } = await supabase
    .from('users')
    .select('push_token')
    .eq('id', streak.user_id)
    .maybeSingle();

  sendPushNotification(
    userRow?.push_token as string | null,
    '🎉 ¡Día confirmado!',
    'Tu padrino validó tu día limpio. ¡Sigue así!',
  );

  // Broadcast al canal del usuario — fire-and-forget (Postgres Changes también notifica al móvil)
  const broadcastChannel = supabase.channel(`user-${streak.user_id}`);
  broadcastChannel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') return;
    broadcastChannel
      .send({
        type: 'broadcast',
        event: 'day_confirmed',
        payload: { daysCount, newAchievement, message: '¡Tu padrino confirmó tu día limpio! 🌱' },
      })
      .finally(() => supabase.removeChannel(broadcastChannel));
  });

  res.json({ success: true, data: { confirmed: true, daysCount, newAchievement } });
});

export default router;
