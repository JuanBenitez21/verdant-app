import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { usePlantaStore } from '@/store/planta.store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface CelebrationData {
  daysCount: number;
  newAchievement: string | null;
}

export interface RachaState {
  diasTotales: number;
  rachaActual: number;
  ultimoReporte: string | null;
  puedeReportarHoy: boolean;
  esperandoConfirmacion: boolean;
  godparentConfirmedToday: boolean;
  showCelebration: boolean;
  celebrationData: CelebrationData | null;
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
    esperandoConfirmacion: false,
    godparentConfirmedToday: false,
    showCelebration: false,
    celebrationData: null,
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
    const todayStreak = streaks?.find(s => s.date === today);
    const puedeReportarHoy = !todayStreak;
    const esperandoConfirmacion = !!todayStreak?.self_reported && !todayStreak?.godparent_confirmed;
    const godparentConfirmedToday = !!todayStreak?.godparent_confirmed;

    setStreakDays(diasTotales);

    setState(s => ({
      ...s,
      diasTotales,
      rachaActual,
      ultimoReporte,
      puedeReportarHoy,
      esperandoConfirmacion,
      godparentConfirmedToday,
      isLoading: false,
      isReporting: false,
      error: null,
    }));
  }, [userId, setStreakDays]);

  // Nombre de canal único por instancia — evita conflictos cuando el hook se monta en múltiples componentes
  const channelName = useMemo(
    () => `streaks-rt-${userId ?? 'anon'}-${Math.random().toString(36).slice(2, 8)}`,
    [userId],
  );

  // Ref para evitar stale closure en el callback de Realtime
  const cargarRachaRef = useRef(cargarRacha);
  useEffect(() => { cargarRachaRef.current = cargarRacha; }, [cargarRacha]);

  // Suscripción a Postgres Changes — cuando el padrino confirma, muestra celebración
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streaks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as { godparent_confirmed: boolean; date: string };
          const today = new Date().toISOString().split('T')[0]!;
          if (updated.godparent_confirmed && updated.date === today) {
            setState(s => ({
              ...s,
              esperandoConfirmacion: false,
              godparentConfirmedToday: true,
              puedeReportarHoy: false,
              showCelebration: true,
              celebrationData: { daysCount: s.diasTotales + 1, newAchievement: null },
            }));
            cargarRachaRef.current();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const clearCelebration = useCallback(() => {
    setState(s => ({ ...s, showCelebration: false, celebrationData: null }));
  }, []);

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

    setState(s => ({
      ...s,
      isReporting: false,
      puedeReportarHoy: false,
      esperandoConfirmacion: true,
      ultimoReporte: today,
    }));

    return json.data ?? null;
  }, []);

  return { ...state, cargarRacha, reportarDiaLimpio, clearCelebration };
}
