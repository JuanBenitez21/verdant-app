import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { apiFetch, isNetworkError } from '@/services/api.service';
import { getScoreLevel } from '@verdant/shared';
import type { ScoreComponents, ScoreResult } from '@verdant/shared';

interface ScoreState { score: ScoreComponents | null; scoreLevel: ScoreResult; isLoading: boolean }

export function useScore() {
  const [state, setState] = useState<ScoreState>({ score: null, scoreLevel: getScoreLevel(0), isLoading: true });

  const cargarScore = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      // 1️⃣ Intenta backend
      const br = await apiFetch<ScoreComponents & { level: ScoreResult }>('/api/score/current');
      if (!isNetworkError(br)) {
        if (br.success && br.data) {
          const { level, ...components } = br.data;
          setState({ score: components, scoreLevel: level, isLoading: false });
        } else {
          setState({ score: null, scoreLevel: getScoreLevel(0), isLoading: false });
        }
        return;
      }

      // 2️⃣ Fallback Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState({ score: null, scoreLevel: getScoreLevel(0), isLoading: false }); return; }

      const { data: row } = await supabase
        .from('scores').select('*').eq('user_id', session.user.id)
        .order('date', { ascending: false }).limit(1).maybeSingle();

      if (row) {
        const c: ScoreComponents = {
          wearableHrPts: row.wearable_hr_pts as number, wearableStepsPts: row.wearable_steps_pts as number,
          wearableSleepPts: row.wearable_sleep_pts as number, godparentPts: row.godparent_pts as number,
          selfReportPts: row.self_report_pts as number, coherencePts: row.coherence_pts as number,
          totalScore: row.total_score as number, incoherenceFlag: row.incoherence_flag as boolean,
        };
        setState({ score: c, scoreLevel: getScoreLevel(row.total_score as number), isLoading: false });
        return;
      }

      // Sin score en BD: calcular básico desde streaks del día
      const today = new Date().toISOString().split('T')[0]!;
      const { data: ts } = await supabase.from('streaks').select('self_reported, godparent_confirmed')
        .eq('user_id', session.user.id).eq('date', today).eq('relapse', false).maybeSingle();
      let total = 0;
      if (ts?.self_reported) total += 15;
      if (ts?.godparent_confirmed) total += 35;
      setState({ score: null, scoreLevel: getScoreLevel(total), isLoading: false });
    } catch { setState({ score: null, scoreLevel: getScoreLevel(0), isLoading: false }); }
  }, []);

  return { ...state, cargarScore };
}
