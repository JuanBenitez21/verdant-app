import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { apiFetch, isNetworkError } from '@/services/api.service';
import { getPlantStage } from '@/constants/plants';

export interface PendingConfirmation {
  token: string; userName: string; plantName: string; plantEmoji: string; daysCount: number;
}

export function usePadrino() {
  const [pendientes, setPendientes] = useState<PendingConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cargarPendientes = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1️⃣ Intenta backend
      const br = await apiFetch<PendingConfirmation[]>('/api/padrino/mis-pendientes');
      if (!isNetworkError(br)) {
        setPendientes(br.success ? (br.data ?? []) : []);
        setIsLoading(false);
        return;
      }

      // 2️⃣ Fallback Supabase RPC
      const { data, error } = await supabase.rpc('get_my_pending_confirmations');
      if (error || !data) { setPendientes([]); setIsLoading(false); return; }

      type Row = { token: string; userName: string; plantName: string; plantType: string; daysCount: number };
      setPendientes((data as Row[]).map(r => ({
        token: r.token, userName: r.userName, plantName: r.plantName,
        plantEmoji: getPlantStage(r.daysCount).emoji, daysCount: r.daysCount,
      })));
    } catch { setPendientes([]); }
    setIsLoading(false);
  }, []);

  return { pendientes, isLoading, cargarPendientes };
}
