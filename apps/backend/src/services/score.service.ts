import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INCOHERENCE_THRESHOLD } from '@verdant/shared';
import type { ScoreComponents } from '@verdant/shared';

function getSupabase(): SupabaseClient {
  return createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  );
}

// Calcula y persiste el Score Verdant para un usuario en una fecha dada
export async function calculateScore(userId: string, date: string): Promise<ScoreComponents> {
  const supabase = getSupabase();

  // Obtener racha del día específico
  const { data: streak } = await supabase
    .from('streaks')
    .select('self_reported, godparent_confirmed')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  // Contar días totales confirmados para simular progresión wearable
  const { count: totalDays } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('godparent_confirmed', true)
    .eq('relapse', false);

  const dias = totalDays ?? 0;

  const selfReported = streak?.self_reported === true;
  const godparentConfirmed = streak?.godparent_confirmed === true;

  // Componentes del score
  const godparentPts = godparentConfirmed ? 25 : 0;
  const selfReportPts = selfReported ? 15 : 0;

  // Wearable simulado: mejora progresiva según días acumulados
  const wearableHrPts = Math.min(20, Math.floor(dias * 0.4));
  const wearableStepsPts = Math.min(15, Math.floor(dias * 0.3));
  const wearableSleepPts = Math.min(15, Math.floor(dias * 0.3));

  // Coherencia entre wearable y social
  let coherencePts = 0;
  if (godparentConfirmed && selfReported) coherencePts = 10;
  else if (selfReported) coherencePts = 4;

  const wearableTotal = wearableHrPts + wearableStepsPts + wearableSleepPts;
  const socialTotal = godparentPts + selfReportPts;
  const incoherenceFlag = Math.abs(wearableTotal - socialTotal) > INCOHERENCE_THRESHOLD;

  const totalScore =
    wearableHrPts + wearableStepsPts + wearableSleepPts +
    godparentPts + selfReportPts + coherencePts;

  // Persistir en tabla scores (upsert por fecha)
  await supabase.from('scores').upsert(
    {
      user_id: userId,
      date,
      wearable_hr_pts: wearableHrPts,
      wearable_steps_pts: wearableStepsPts,
      wearable_sleep_pts: wearableSleepPts,
      godparent_pts: godparentPts,
      self_report_pts: selfReportPts,
      coherence_pts: coherencePts,
      incoherence_flag: incoherenceFlag,
    },
    { onConflict: 'user_id,date' },
  );

  return {
    wearableHrPts,
    wearableStepsPts,
    wearableSleepPts,
    godparentPts,
    selfReportPts,
    coherencePts,
    totalScore,
    incoherenceFlag,
  };
}
