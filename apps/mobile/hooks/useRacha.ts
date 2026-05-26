import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { usePlantaStore } from '@/store/planta.store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface RachaState {
  diasTotales: number;
  rachaActual: number;
  ultimoReporte: string | null;
  puedeReportarHoy: boolean;
  isLoading: boolean;
  isReporting: boolean;
  error: string | null;
}

export function useRacha(userId: string | null) {
  const [state, setState] = useState<RachaState>({
    diasTotales: 0,
    rachaActual: 0,
    ultimoReporte: null,
    puedeReportarHoy: true,
    isLoading: true,
    isReporting: false,
    error: null,
  });

  const { setStreakDays } = usePlantaStore();

  const cargarRacha = useCallback(async () => {
    if (!userId) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    const today = new Date().toISOString().split('T')[0]!;

    const { data: streaks } = await supabase
      .from('streaks')
      .select('date, godparent_confirmed, self_reported, relapse')
      .eq('user_id', userId)
      .eq('relapse', false)
      .order('date', { ascending: false });

    const confirmed = streaks?.filter(s => s.godparent_confirmed) ?? [];
    const diasTotales = confirmed.length;

    // Racha actual: días consecutivos confirmados hacia atrás desde hoy
    let rachaActual = 0;
    const sortedDates = confirmed.map(s => s.date as string).sort().reverse();
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (sortedDates[i] === expected.toISOString().split('T')[0]) {
        rachaActual++;
      } else {
        break;
      }
    }

    const ultimoReporte = streaks?.[0]?.date as string | null ?? null;
    const puedeReportarHoy = !streaks?.some(s => s.date === today);

    setStreakDays(diasTotales);

    setState({
      diasTotales,
      rachaActual,
      ultimoReporte,
      puedeReportarHoy,
      isLoading: false,
      isReporting: false,
      error: null,
    });
  }, [userId, setStreakDays]);

  const reportarDiaLimpio = useCallback(async (): Promise<{ daysCount: number } | null> => {
    setState(s => ({ ...s, isReporting: true, error: null }));

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setState(s => ({ ...s, isReporting: false, error: 'Sin sesión activa' }));
      return null;
    }

    const today = new Date().toISOString().split('T')[0]!;

    const res = await fetch(`${API_URL}/api/rachas/daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: today }),
    });

    const json = await res.json() as {
      success: boolean;
      data?: { daysCount: number };
      error?: { code: string; message: string };
    };

    if (!json.success) {
      const msg = json.error?.code === 'ALREADY_REPORTED'
        ? 'Ya reportaste hoy'
        : (json.error?.message ?? 'Error al reportar');
      setState(s => ({ ...s, isReporting: false, error: msg, puedeReportarHoy: false }));
      return null;
    }

    // Actualizar estado local sin refetch completo
    setState(s => ({
      ...s,
      isReporting: false,
      puedeReportarHoy: false,
      diasTotales: s.diasTotales,
      ultimoReporte: today,
    }));

    return json.data ?? null;
  }, []);

  return { ...state, cargarRacha, reportarDiaLimpio };
}
