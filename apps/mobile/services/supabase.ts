import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Expo SDK 51 inyecta EXPO_PUBLIC_* en proceso de build vía metro/babel
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Adapter de SecureStore para que Supabase persista la sesión de forma segura
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Placeholder del tipo Database — se reemplaza con el generado por Supabase CLI
export type Database = Record<string, unknown>;
