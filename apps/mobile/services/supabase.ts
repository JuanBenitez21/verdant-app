import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// SecureStore tiene límite de 2048 bytes por clave.
// Los tokens de sesión de Supabase pueden superarlo: los dividimos en chunks.
const CHUNK = 1800;

const ChunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}__n`);
      if (!countStr) return SecureStore.getItemAsync(key); // retrocompatibilidad
      const n = parseInt(countStr, 10);
      const parts: string[] = [];
      for (let i = 0; i < n; i++) {
        const p = await SecureStore.getItemAsync(`${key}__${i}`);
        if (p === null) return null;
        parts.push(p);
      }
      return parts.join('');
    } catch { return null; }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (value.length <= CHUNK) {
        await SecureStore.setItemAsync(key, value);
        await SecureStore.deleteItemAsync(`${key}__n`).catch(() => null);
        return;
      }
      await SecureStore.deleteItemAsync(key).catch(() => null);
      const n = Math.ceil(value.length / CHUNK);
      await SecureStore.setItemAsync(`${key}__n`, String(n));
      for (let i = 0; i < n; i++) {
        await SecureStore.setItemAsync(`${key}__${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
      }
    } catch (e) { console.warn('[SecureStore]', e); }
  },
  async removeItem(key: string): Promise<void> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}__n`);
      if (countStr) {
        const n = parseInt(countStr, 10);
        for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${key}__${i}`).catch(() => null);
        await SecureStore.deleteItemAsync(`${key}__n`).catch(() => null);
      }
      await SecureStore.deleteItemAsync(key).catch(() => null);
    } catch { /* silencioso */ }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ChunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = Record<string, unknown>;
