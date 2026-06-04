import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { apiFetch, isNetworkError } from '@/services/api.service';
import { usePlantaStore } from '@/store/planta.store';

export interface CelebrationData { daysCount: number; newAchievement: string | null }

export interface RachaState {
  diasTotales: number; rachaActual: number; ultimoReporte: string | null;
  puedeReportarHoy: boolean; esperandoConfirmacion: boolean;
  godparentConfirmedToday: boolean; showCelebration: boolean;
  celebrationData: CelebrationData | null; isLoading: boolean;
  isReporting: boolean; error: string | null;
}

function generateToken(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
}

function midnightExpiry(): string {
  const bogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  bogota.setHours(23, 59, 59, 999);
  return new Date(bogota.getTime() + 5 * 60 * 60 * 1000).toISOString();
}

export function useRacha(userId: string | null) {
  const [state, setState] = useState<RachaState>({
    diasTotales: 0, rachaActual: 0, ultimoReporte: null,
    puedeReportarHoy: true, esperandoConfirmacion: false,
    godparentConfirmedToday: false, showCelebration: false,
    celebrationData: null, isLoading: true, isReporting: false, error: null,
  });
  const { setStreakDays } = usePlantaStore();

  const cargarRacha = useCallback(async () => {
    if (!userId) { setState(s => ({ ...s, isLoading: false })); return; }
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const today = new Date().toISOString().split('T')[0]!;
      const { data: streaks, error: dbErr } = await supabase
        .from('streaks').select('date, godparent_confirmed, self_reported, relapse')
        .eq('user_id', userId).eq('relapse', false).order('date', { ascending: false });

      if (dbErr) { setState(s => ({ ...s, isLoading: false, error: 'Error al cargar tu racha.' })); return; }

      const confirmed = (streaks ?? []).filter(s => s.godparent_confirmed);
      const diasTotales = confirmed.length;
      let rachaActual = 0;
      const sorted = confirmed.map(s => s.date as string).sort().reverse();
      for (let i = 0; i < sorted.length; i++) {
        const exp = new Date(today); exp.setDate(exp.getDate() - i);
        if (sorted[i] === exp.toISOString().split('T')[0]) rachaActual++;
        else break;
      }
      const todayStreak = (streaks ?? []).find(s => s.date === today);
      setStreakDays(diasTotales);
      setState(s => ({
        ...s, diasTotales, rachaActual,
        ultimoReporte: streaks?.[0]?.date as string | null ?? null,
        puedeReportarHoy: !todayStreak,
        esperandoConfirmacion: !!todayStreak?.self_reported && !todayStreak?.godparent_confirmed,
        godparentConfirmedToday: !!todayStreak?.godparent_confirmed,
        isLoading: false, error: null,
      }));
    } catch { setState(s => ({ ...s, isLoading: false, error: 'Error al cargar tu racha.' })); }
  }, [userId, setStreakDays]);

  const channelName = useMemo(() => `streaks-rt-${userId ?? 'anon'}-${Math.random().toString(36).slice(2, 8)}`, [userId]);
  const cargarRachaRef = useRef(cargarRacha);
  useEffect(() => { cargarRachaRef.current = cargarRacha; }, [cargarRacha]);

  // Realtime Postgres Changes
  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(channelName)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'streaks', filter: `user_id=eq.${userId}` },
        (payload) => {
          const u = payload.new as { godparent_confirmed: boolean; date: string };
          const today = new Date().toISOString().split('T')[0]!;
          if (u.godparent_confirmed && u.date === today) {
            setState(s => ({
              ...s, esperandoConfirmacion: false, godparentConfirmedToday: true,
              puedeReportarHoy: false, showCelebration: true,
              celebrationData: { daysCount: s.diasTotales + 1, newAchievement: null },
            }));
            cargarRachaRef.current();
          }
        }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  // Polling cada 15 seg como fallback cuando esperando confirmación
  useEffect(() => {
    if (!state.esperandoConfirmacion || !userId) return;
    const iv = setInterval(async () => {
      const today = new Date().toISOString().split('T')[0]!;
      const { data } = await supabase.from('streaks')
        .select('godparent_confirmed').eq('user_id', userId).eq('date', today).maybeSingle();
      if (data?.godparent_confirmed) {
        clearInterval(iv);
        setState(s => ({
          ...s, esperandoConfirmacion: false, godparentConfirmedToday: true,
          puedeReportarHoy: false, showCelebration: true,
          celebrationData: { daysCount: s.diasTotales + 1, newAchievement: null },
        }));
        cargarRachaRef.current();
      }
    }, 15000);
    return () => clearInterval(iv);
  }, [state.esperandoConfirmacion, userId]);

  const clearCelebration = useCallback(() => {
    setState(s => ({ ...s, showCelebration: false, celebrationData: null }));
  }, []);

  const reportarDiaLimpio = useCallback(async (): Promise<{ daysCount: number } | null> => {
    setState(s => ({ ...s, isReporting: true, error: null }));
    const today = new Date().toISOString().split('T')[0]!;
    try {
      // 1️⃣ Intenta backend local
      const br = await apiFetch<{ streakId: string; daysCount: number; plantStage: string; godparentToken: string }>(
        '/api/rachas/daily', { method: 'POST', body: JSON.stringify({ date: today }) },
      );
      if (!isNetworkError(br)) {
        if (!br.success) {
          const msg = br.error?.code === 'ALREADY_REPORTED' ? 'Ya reportaste hoy'
            : br.error?.code === 'RATE_LIMIT' ? 'Demasiados intentos. Intenta más tarde.'
            : (br.error?.message ?? 'Error al reportar');
          setState(s => ({ ...s, isReporting: false, error: msg, puedeReportarHoy: false }));
          return null;
        }
        setState(s => ({ ...s, isReporting: false, puedeReportarHoy: false, esperandoConfirmacion: true, ultimoReporte: today }));
        return br.data ?? null;
      }

      // 2️⃣ Fallback Supabase RPC
      const token = generateToken();
      const { data: rpc, error: rpcErr } = await supabase.rpc('report_daily_day', {
        p_date: today, p_token: token, p_expires_at: midnightExpiry(),
      });
      if (rpcErr || !rpc?.success) {
        const code = rpc?.code as string | undefined;
        const msg = code === 'ALREADY_REPORTED' ? 'Ya reportaste hoy' : (rpc?.error as string | undefined ?? 'Error al reportar');
        setState(s => ({ ...s, isReporting: false, error: msg, puedeReportarHoy: false }));
        return null;
      }
      if (__DEV__) {
        const { data: p } = await supabase.from('users').select('godparent_email').eq('id', userId!).maybeSingle();
        console.log('🔗 [DEV] Link padrino: verdant://padrino/confirmar/' + token);
        console.log('📧 [DEV] Email padrino:', p?.godparent_email ?? 'no configurado');
      }
      setState(s => ({ ...s, isReporting: false, puedeReportarHoy: false, esperandoConfirmacion: true, ultimoReporte: today }));
      return { daysCount: rpc.daysCount as number };
    } catch (e) {
      console.warn('[useRacha]', e);
      setState(s => ({ ...s, isReporting: false, error: 'Error al reportar. Intenta de nuevo.' }));
      return null;
    }
  }, [userId]);

  return { ...state, cargarRacha, reportarDiaLimpio, clearCelebration };
}
