-- ============================================================
-- Verdant — Migración 005 (Sprint 5)
-- Ejecutar en el SQL Editor de Supabase una sola vez
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- Tabla de registro de migraciones ejecutadas
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Función que actualiza last_active_at en cada UPDATE de users
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: activa la función antes de cada UPDATE en users
DROP TRIGGER IF EXISTS users_last_active ON users;
CREATE TRIGGER users_last_active
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- Registrar esta migración
INSERT INTO _migrations (filename) VALUES ('005_sprint5_additions.sql') ON CONFLICT DO NOTHING;
