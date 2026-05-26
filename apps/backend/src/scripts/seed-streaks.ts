import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

(global as unknown as Record<string, unknown>)['WebSocket'] = ws;

// Usuarios con ID conocido que deben insertarse en la tabla users
const KNOWN_USERS = [
  {
    id: 'b0ee94ea-3bb4-4e6f-8d7e-16f9f6abb8a5',
    email: 'juanbenbe@unisabana.edu.co',
    full_name: 'Juan',
    domain: 'unisabana.edu.co',
    cigarettes_per_day: 8,
    years_smoking: 3,
    price_per_pack: 9000,
    plant_type: 'orquidea' as const,
    plant_name: 'Orquídea',
    streakDays: 15, // etapa joven 🪴
  },
  {
    id: 'ad94de57-6d8f-4749-a577-69b52a68eb53',
    email: 'jp@verdant.app',
    full_name: 'Jp',
    domain: 'verdant.app',
    cigarettes_per_day: 6,
    years_smoking: 2,
    price_per_pack: 9000,
    plant_type: 'clasico' as const,
    plant_name: 'Zen',
    streakDays: 7, // etapa plántula 🌿
  },
];

// Usuarios creados por el seed anterior (se buscan por email en auth)
const SEEDED_USERS = [
  { email: 'laura@test.com', streakDays: 30 }, // etapa flor 🌸
  { email: 'carlos@test.com', streakDays: 3 },  // etapa brote 🌱
];

const ACHIEVEMENT_MILESTONES = [1, 3, 7, 15, 30, 60, 100];

function datesBefore(days: number): string[] {
  const dates: string[] = [];
  const today = new Date('2026-05-25');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]!);
  }
  return dates;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertStreaks(supabase: any, userId: string, days: number) {
  const dates = datesBefore(days);
  const rows = dates.map((date) => ({
    user_id: userId,
    date,
    self_reported: true,
    godparent_confirmed: true,
    godparent_confirmed_at: new Date(date + 'T20:00:00Z').toISOString(),
    relapse: false,
  }));

  const { error } = await supabase.from('streaks').upsert(rows, { onConflict: 'user_id,date' });
  if (error) console.error(`  ❌ Error insertando rachas para ${userId}:`, error.message);
  else console.log(`  ✅ ${days} rachas creadas`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertAchievements(supabase: any, userId: string, days: number) {
  const earned = ACHIEVEMENT_MILESTONES.filter((m) => days >= m);
  if (earned.length === 0) return;

  const rows = earned.map((m) => ({
    user_id: userId,
    achievement_key: `day_${m}`,
  }));

  const { error } = await supabase.from('achievements').upsert(rows, { onConflict: 'user_id,achievement_key' });
  if (error) console.error(`  ❌ Error insertando logros:`, error.message);
  else console.log(`  🏆 Logros desbloqueados: ${earned.map((m) => `day_${m}`).join(', ')}`);
}

async function seedStreaks() {
  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- 1. Obtener institution_ids por dominio ---
  const { data: institutions } = await supabase
    .from('institutions')
    .select('id, domain');

  const institutionMap = new Map<string, string>(
    (institutions ?? []).map((i: { id: string; domain: string }) => [i.domain, i.id]),
  );

  // --- 2. Insertar Juan y JP en tabla users ---
  console.log('\n📋 Insertando perfiles en tabla users...');

  for (const u of KNOWN_USERS) {
    const institution_id = institutionMap.get(u.domain) ?? null;

    const { error } = await supabase.from('users').upsert(
      {
        id: u.id,
        full_name: u.full_name,
        institution_id,
        cigarettes_per_day: u.cigarettes_per_day,
        years_smoking: u.years_smoking,
        price_per_pack: u.price_per_pack,
        plant_type: u.plant_type,
        plant_name: u.plant_name,
      },
      { onConflict: 'id' },
    );

    if (error) console.error(`  ❌ ${u.email}:`, error.message);
    else console.log(`  ✅ Perfil upserted: ${u.email}`);
  }

  // --- 3. Crear rachas para Juan y JP ---
  console.log('\n🌱 Creando rachas para usuarios conocidos...');

  for (const u of KNOWN_USERS) {
    const stage = u.streakDays >= 30 ? '🌸 flor' : u.streakDays >= 15 ? '🪴 joven' : u.streakDays >= 7 ? '🌿 plántula' : u.streakDays >= 3 ? '🌱 brote' : '🌰 semilla';
    console.log(`\n👤 ${u.email} — ${u.streakDays} días (${stage})`);
    await upsertStreaks(supabase, u.id, u.streakDays);
    await upsertAchievements(supabase, u.id, u.streakDays);
  }

  // --- 4. Buscar IDs de Laura y Carlos para sus rachas ---
  console.log('\n🌱 Creando rachas para usuarios del seed anterior...');

  for (const u of SEEDED_USERS) {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find((a) => a.email === u.email);

    if (!authUser) {
      console.log(`  ⚠️  No encontrado en auth: ${u.email} — corre seed.ts primero`);
      continue;
    }

    const stage = u.streakDays >= 30 ? '🌸 flor' : u.streakDays >= 15 ? '🪴 joven' : u.streakDays >= 7 ? '🌿 plántula' : u.streakDays >= 3 ? '🌱 brote' : '🌰 semilla';
    console.log(`\n👤 ${u.email} — ${u.streakDays} días (${stage})`);
    await upsertStreaks(supabase, authUser.id, u.streakDays);
    await upsertAchievements(supabase, authUser.id, u.streakDays);
  }

  console.log('\n✅ Seed de rachas completado.');
}

seedStreaks().catch((err: unknown) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
