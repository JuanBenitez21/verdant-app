import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface PendingConfirmation {
  token: string;
  userName: string;
  plantName: string;
  plantEmoji: string;
  daysCount: number;
}

export function usePadrino() {
  const [pendientes, setPendientes] = useState<PendingConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cargarPendientes = useCallback(async () => {
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setIsLoading(false);
      return;
    }

    const res = await fetch(`${API_URL}/api/padrino/mis-pendientes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json() as { success: boolean; data?: PendingConfirmation[] };
    setPendientes(json.success ? (json.data ?? []) : []);
    setIsLoading(false);
  }, []);

  return { pendientes, isLoading, cargarPendientes };
}
