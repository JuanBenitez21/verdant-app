import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

// Polyfill WebSocket para Node.js 20 (no tiene WebSocket nativo)
(global as unknown as Record<string, unknown>).WebSocket = ws;

let _client: SupabaseClient | null = null;

// Singleton con service role — usa este en todos los routes y middleware
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados');

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _client;
}
