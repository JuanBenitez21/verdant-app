import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { getScoreLevel } from '@verdant/shared';
import type { ScoreComponents, ScoreResult } from '@verdant/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ScoreState {
  score: ScoreComponents | null;
  scoreLevel: ScoreResult;
  isLoading: boolean;
}

export function useScore() {
  const [state, setState] = useState<ScoreState>({
    score: null,
    scoreLevel: getScoreLevel(0),
    isLoading: true,
  });

  const cargarScore = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setState({ score: null, scoreLevel: getScoreLevel(0), isLoading: false });
      return;
    }

    const res = await fetch(`${API_URL}/api/score/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json() as {
      success: boolean;
      data?: ScoreComponents & { level: ScoreResult };
    };

    if (!json.success || !json.data) {
      setState({ score: null, scoreLevel: getScoreLevel(0), isLoading: false });
      return;
    }

    const { level, ...components } = json.data;

    setState({
      score: components,
      scoreLevel: level,
      isLoading: false,
    });
  }, []);

  return { ...state, cargarScore };
}
