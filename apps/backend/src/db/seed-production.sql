-- ============================================================
-- Verdant — Seed de producción
-- Solo instituciones reales — NO datos de prueba
-- Ejecutar UNA vez en el proyecto de Supabase de producción
-- ============================================================

INSERT INTO institutions (name, domain, active) VALUES
  ('Universidad de La Sabana',   'unisabana.edu.co',  true),
  ('Universidad de los Andes',   'uniandes.edu.co',   true),
  ('Universidad Nacional',        'unal.edu.co',       true),
  ('Universidad Javeriana',       'javeriana.edu.co',  true),
  ('Universidad del Rosario',     'urosario.edu.co',   true)
ON CONFLICT (domain) DO NOTHING;
