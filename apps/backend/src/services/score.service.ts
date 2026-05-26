import { getSupabase } from '../lib/supabase';
import { INCOHERENCE_THRESHOLD } from '@verdant/shared';
import type { ScoreComponents } from '@verdant/shared';

export async function calculateScore(userId: string, date: string): Promise<ScoreComponents> {
  const supabase = getSupabase();

  const { data: streak } = await supabase
    .from('streaks').select('self_reported, godparent_confirmed')
    .eq('user_id', userId).eq('date', date).maybeSingle();

  const { count: totalDays } = await supabase
    .from('streaks').select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('godparent_confirmed', true).eq('relapse', false);

  const dias = totalDays ?? 0;
  const selfReported = streak?.self_reported === true;
  const godparentConfirmed = streak?.godparent_confirmed === true;

  const godparentPts = godparentConfirmed ? 25 : 0;
  const selfReportPts = selfReported ? 15 : 0;
  const wearableHrPts = Math.min(20, Math.floor(dias * 0.4));
  const wearableStepsPts = Math.min(15, Math.floor(dias * 0.3));
  const wearableSleepPts = Math.min(15, Math.floor(dias * 0.3));

  let coherencePts = 0;
  if (godparentConfirmed && selfReported) coherencePts = 10;
  else if (selfReported) coherencePts = 4;

  const wearableTotal = wearableHrPts + wearableStepsPts + wearableSleepPts;
  const socialTotal = godparentPts + selfReportPts;
  const incoherenceFlag = Math.abs(wearableTotal - socialTotal) > INCOHERENCE_THRESHOLD;

  const totalScore = wearableHrPts + wearableStepsPts + wearableSleepPts + godparentPts + selfReportPts + coherencePts;

  await supabase.from('scores').upsert(
    { user_id: userId, date, wearable_hr_pts: wearableHrPts, wearable_steps_pts: wearableStepsPts,
      wearable_sleep_pts: wearableSleepPts, godparent_pts: godparentPts, self_report_pts: selfReportPts,
      coherence_pts: coherencePts, incoherence_flag: incoherenceFlag },
    { onConflict: 'user_id,date' },
  );

  return { wearableHrPts, wearableStepsPts, wearableSleepPts, godparentPts, selfReportPts, coherencePts, totalScore, incoherenceFlag };
}
