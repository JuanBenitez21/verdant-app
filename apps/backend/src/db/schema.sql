-- ============================================================
-- Verdant App — Esquema PostgreSQL para Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Instituciones habilitadas
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Perfil de usuario (complementa auth.users de Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id),
  full_name TEXT NOT NULL,
  cigarettes_per_day INT DEFAULT 10,
  years_smoking NUMERIC(4,1) DEFAULT 1,
  price_per_pack INT DEFAULT 9000,
  plant_type TEXT DEFAULT 'sakura' CHECK (plant_type IN ('sakura', 'clasico', 'orquidea', 'cactus')),
  plant_name TEXT DEFAULT 'Mi planta',
  godparent_id UUID REFERENCES users(id),
  godparent_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rachas diarias
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  self_reported BOOLEAN DEFAULT false,
  godparent_confirmed BOOLEAN DEFAULT false,
  godparent_confirmed_at TIMESTAMPTZ,
  relapse BOOLEAN DEFAULT false,
  score_snapshot INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Logros desbloqueados
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_key TEXT NOT NULL CHECK (achievement_key IN ('day_1','day_3','day_7','day_15','day_30','day_60','day_100')),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_key)
);

-- Tokens únicos de padrino
CREATE TABLE IF NOT EXISTS godparent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streak_id UUID REFERENCES streaks(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  friction_answer TEXT
);

-- Scores Verdant (calculados cada noche)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  wearable_hr_pts INT DEFAULT 0,
  wearable_steps_pts INT DEFAULT 0,
  wearable_sleep_pts INT DEFAULT 0,
  godparent_pts INT DEFAULT 0,
  self_report_pts INT DEFAULT 0,
  coherence_pts INT DEFAULT 0,
  total_score INT GENERATED ALWAYS AS (
    wearable_hr_pts + wearable_steps_pts + wearable_sleep_pts +
    godparent_pts + self_report_pts + coherence_pts
  ) STORED,
  incoherence_flag BOOLEAN DEFAULT false,
  UNIQUE(user_id, date)
);

-- ============================================================
-- Índices para queries frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_date ON streaks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, date);

-- ============================================================
-- Datos de prueba — institución de ejemplo
-- ============================================================
INSERT INTO institutions (name, domain) VALUES
  ('Universidad de La Sabana', 'unisabana.edu.co'),
  ('Verdant Demo', 'verdant.app')
ON CONFLICT (domain) DO NOTHING;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven su propio perfil
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid() = id);

-- Usuarios solo ven sus propias rachas
CREATE POLICY "streaks_own" ON streaks FOR ALL USING (auth.uid() = user_id);

-- Usuarios solo ven sus propios logros
CREATE POLICY "achievements_own" ON achievements FOR ALL USING (auth.uid() = user_id);

-- Usuarios solo ven sus propios scores
CREATE POLICY "scores_own" ON scores FOR ALL USING (auth.uid() = user_id);

-- Godparent tokens son públicos para lectura (el padrino no tiene cuenta)
ALTER TABLE godparent_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "godparent_tokens_public_read" ON godparent_tokens FOR SELECT USING (true);
