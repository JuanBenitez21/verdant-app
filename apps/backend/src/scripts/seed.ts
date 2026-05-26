import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Node.js 20 no tiene WebSocket nativo — lo polyfillamos antes de crear el cliente
(global as unknown as Record<string, unknown>)['WebSocket'] = ws;

const TEST_USERS = [
  {
    email: 'laura@test.com',
    password: 'Verdant2026',
    name: 'Laura García',
    cigarettesPerDay: 10,
    yearsSmoking: 2,
    pricePerPack: 9000,
    plantType: 'sakura',
    plantName: 'Hanami',
    godparentEmail: 'carlos@test.com',
  },
  {
    email: 'carlos@test.com',
    password: 'Verdant2026',
    name: 'Carlos Martínez',
    cigarettesPerDay: 5,
    yearsSmoking: 1,
    pricePerPack: 9000,
    plantType: 'cactus',
    plantName: 'Rocky',
    godparentEmail: 'laura@test.com',
  },
] as const;

async function seed() {
  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const user of TEST_USERS) {
    // Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`⚠️  Ya existe: ${user.email}`);
      } else {
        console.error(`❌ Error creando ${user.email}:`, authError.message);
      }
      continue;
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.error(`❌ No se obtuvo ID para ${user.email}`);
      continue;
    }

    // Insertar perfil en tabla users
    const { error: profileError } = await supabase.from('users').upsert({
      id: userId,
      full_name: user.name,
      cigarettes_per_day: user.cigarettesPerDay,
      years_smoking: user.yearsSmoking,
      price_per_pack: user.pricePerPack,
      plant_type: user.plantType,
      plant_name: user.plantName,
      godparent_email: user.godparentEmail,
    });

    if (profileError) {
      console.error(`❌ Error guardando perfil de ${user.email}:`, profileError.message);
    } else {
      console.log(`✅ Usuario creado: ${user.email}`);
    }
  }

  console.log('\nSeed completado.');
}

seed().catch((err: unknown) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
