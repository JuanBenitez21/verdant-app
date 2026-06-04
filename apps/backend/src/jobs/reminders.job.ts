import cron from 'node-cron';
import { getSupabase } from '../lib/supabase';
import { sendPushNotification } from '../services/notification.service';

// Cron 19:00 Colombia = 00:00 UTC (UTC-5)
// Avisa al padrino si su apadrinado no reportó hoy
cron.schedule('0 0 * * *', async () => {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0]!;
  console.log(`[cron] 19:00 — recordatorio padrinos para ${today}`);

  const { data: activeUsers } = await supabase
    .from('users')
    .select('id, full_name, godparent_email')
    .not('godparent_email', 'is', null);

  if (!activeUsers) return;

  for (const user of activeUsers as { id: string; full_name: string; godparent_email: string }[]) {
    const { data: todayStreak } = await supabase
      .from('streaks')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (!todayStreak) {
      // Buscar push token del padrino
      const { data: godparentUser } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', user.id)
        .maybeSingle();

      if (godparentUser?.push_token) {
        await sendPushNotification(
          godparentUser.push_token as string,
          '🌱 Recordatorio',
          `${user.full_name} aún no reportó hoy. ¿Puedes recordarle?`,
        );
      }
    }
  }
}, { timezone: 'UTC' });

// Cron 23:30 Colombia = 04:30 UTC siguiente día
// Calcula Score Verdant para todos los usuarios activos del día
cron.schedule('30 4 * * *', async () => {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0]!;
  console.log(`[cron] 23:30 — calculando score para ${today}`);

  const { data: streaksToday } = await supabase
    .from('streaks')
    .select('user_id, self_reported, godparent_confirmed')
    .eq('date', today)
    .eq('relapse', false);

  if (!streaksToday) return;

  for (const streak of streaksToday as { user_id: string; self_reported: boolean; godparent_confirmed: boolean }[]) {
    const selfReportPts  = streak.self_reported ? 15 : 0;
    const godparentPts   = streak.godparent_confirmed ? 25 : 0;
    const coherencePts   = (streak.self_reported && streak.godparent_confirmed) ? 10 : 0;
    const totalScore     = selfReportPts + godparentPts + coherencePts;
    const incoherenceFlag = Math.abs(selfReportPts - godparentPts) > 35;

    await supabase
      .from('scores')
      .upsert({
        user_id: streak.user_id,
        date: today,
        self_report_pts:  selfReportPts,
        godparent_pts:    godparentPts,
        coherence_pts:    coherencePts,
        incoherence_flag: incoherenceFlag,
      }, { onConflict: 'user_id,date' });

    if (incoherenceFlag) {
      console.warn(`[cron] ⚠️ Incoherencia detectada — usuario ${streak.user_id}`);
    }
  }

  console.log(`[cron] ✅ Score calculado para ${streaksToday.length} usuarios`);
}, { timezone: 'UTC' });

console.log('[cron] Jobs de recordatorios y score iniciados');
