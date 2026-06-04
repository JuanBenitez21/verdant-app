import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

function resolveApiUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;
  const hostUri = (Constants.expoConfig?.hostUri ?? (Constants as any).manifest?.debuggerHost ?? '') as string;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3001`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
}

export const API_URL = resolveApiUrl();

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export function isNetworkError(r: ApiResponse): boolean {
  return r.error?.code === 'NETWORK_ERROR';
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { success: false, error: { code: 'NO_SESSION', message: 'Sin sesión activa' } };
  }

  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(options.headers ?? {}),
      },
    });
    try { return await res.json() as ApiResponse<T>; }
    catch { return { success: false, error: { code: 'PARSE_ERROR', message: 'Respuesta inesperada del servidor.' } }; }
  } catch {
    return { success: false, error: { code: 'NETWORK_ERROR', message: `Backend no disponible (${API_URL})` } };
  }
}
